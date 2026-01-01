const DEFAULT_CONFIG = {
  blockedDomains: [
    "x.com",
    "twitter.com",
    "reddit.com",
    "*.reddit.com",
    "netflix.com",
    "youtube.com",
    "instagram.com",
    "facebook.com",
    "pornhub.com"
  ],
  tokenThreshold: 50000,
  serverUrl: "http://localhost:3847",
  enabled: true
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULT_CONFIG, (existing) => {
    chrome.storage.sync.set({ ...DEFAULT_CONFIG, ...existing });
  });
});

function matchDomain(hostname, patterns) {
  const normalizedHostname = hostname.toLowerCase().replace(/^www\./, "");
  
  for (const pattern of patterns) {
    const normalizedPattern = pattern.toLowerCase().replace(/^www\./, "");
    
    if (normalizedPattern.startsWith("*.")) {
      const suffix = normalizedPattern.slice(2);
      if (normalizedHostname === suffix || normalizedHostname.endsWith("." + suffix)) {
        return true;
      }
    } else {
      if (normalizedHostname === normalizedPattern) {
        return true;
      }
    }
  }
  
  return false;
}

async function checkAndBlock(tabId, url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    const config = await new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_CONFIG, resolve);
    });
    
    if (!config.enabled) return;
    
    if (!matchDomain(hostname, config.blockedDomains)) return;
    
    let usage;
    try {
      const response = await fetch(`${config.serverUrl}/usage`);
      if (!response.ok) throw new Error("Server error");
      usage = await response.json();
    } catch (err) {
      chrome.tabs.sendMessage(tabId, {
        type: "SHOW_NOT_CONNECTED",
        serverUrl: config.serverUrl
      });
      return;
    }
    
    const currentTokens = usage.total?.totalTokens ?? 0;
    
    if (currentTokens >= config.tokenThreshold) return;
    
    chrome.tabs.sendMessage(tabId, {
      type: "SHOW_BLOCK",
      currentTokens,
      threshold: config.tokenThreshold,
      breakdown: usage.breakdown || []
    });
    
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
  }
});
