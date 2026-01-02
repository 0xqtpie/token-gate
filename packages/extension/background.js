importScripts("utils.js");

const blockedTabs = new Map();
let pollingInterval = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULT_CONFIG, (existing) => {
    chrome.storage.sync.set({ ...DEFAULT_CONFIG, ...existing });
  });
});

function trackTab(tabId, serverUrl, threshold) {
  const wasEmpty = blockedTabs.size === 0;
  blockedTabs.set(tabId, { serverUrl, threshold });

  if (wasEmpty) {
    startPolling();
  }
}

function untrackTab(tabId) {
  blockedTabs.delete(tabId);

  if (blockedTabs.size === 0) {
    stopPolling();
  }
}

function startPolling() {
  if (pollingInterval) return;

  pollingInterval = setInterval(pollAndBroadcast, 5000);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

async function pollAndBroadcast() {
  if (blockedTabs.size === 0) {
    stopPolling();
    return;
  }

  const config = await new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, resolve);
  });

  let usage = null;
  let serverOnline = false;

  try {
    const response = await fetch(`${config.serverUrl}/usage`);
    if (response.ok) {
      usage = await response.json();
      serverOnline = true;
    }
  } catch {}

  const currentTokens = usage?.total?.totalTokens ?? 0;
  const threshold = config.tokenThreshold;

  for (const [tabId, tabData] of blockedTabs) {
    try {
      if (serverOnline && currentTokens >= threshold) {
        chrome.tabs.sendMessage(tabId, { type: "HIDE_BLOCK" });
        untrackTab(tabId);
      } else if (serverOnline) {
        chrome.tabs.sendMessage(tabId, {
          type: "UPDATE_BLOCK",
          currentTokens,
          threshold,
          breakdown: usage.breakdown || [],
        });
      } else {
        chrome.tabs.sendMessage(tabId, {
          type: "SHOW_NOT_CONNECTED",
          serverUrl: config.serverUrl,
          threshold,
        });
      }
    } catch {}
  }
}

async function checkAndBlock(tabId, url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    const config = await new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_CONFIG, resolve);
    });

    if (!config.enabled) {
      if (blockedTabs.has(tabId)) {
        chrome.tabs.sendMessage(tabId, { type: "HIDE_BLOCK" });
        untrackTab(tabId);
      }
      return;
    }

    if (!matchDomain(hostname, config.blockedDomains)) {
      if (blockedTabs.has(tabId)) {
        chrome.tabs.sendMessage(tabId, { type: "HIDE_BLOCK" });
        untrackTab(tabId);
      }
      return;
    }

    let usage;
    try {
      const response = await fetch(`${config.serverUrl}/usage`);
      if (!response.ok) throw new Error("Server error");
      usage = await response.json();
    } catch {
      chrome.tabs.sendMessage(tabId, {
        type: "SHOW_NOT_CONNECTED",
        serverUrl: config.serverUrl,
        threshold: config.tokenThreshold,
      });
      trackTab(tabId, config.serverUrl, config.tokenThreshold);
      return;
    }

    const currentTokens = usage.total?.totalTokens ?? 0;

    if (currentTokens >= config.tokenThreshold) {
      if (blockedTabs.has(tabId)) {
        chrome.tabs.sendMessage(tabId, { type: "HIDE_BLOCK" });
        untrackTab(tabId);
      }
      return;
    }

    chrome.tabs.sendMessage(tabId, {
      type: "SHOW_BLOCK",
      currentTokens,
      threshold: config.tokenThreshold,
      breakdown: usage.breakdown || [],
    });
    trackTab(tabId, config.serverUrl, config.tokenThreshold);
  } catch (err) {
    console.error("TokenGate error:", err);
  }
}

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0) return;
  checkAndBlock(details.tabId, details.url);
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId !== 0) return;
  checkAndBlock(details.tabId, details.url);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  untrackTab(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
  }
});
