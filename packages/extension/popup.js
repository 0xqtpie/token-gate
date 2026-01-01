const DEFAULT_CONFIG = {
  blockedDomains: [],
  tokenThreshold: 50000,
  serverUrl: "http://localhost:3847",
  enabled: true
};

function formatTokens(num) {
  return num.toLocaleString();
}

async function loadData() {
  const loading = document.getElementById("loading");
  const content = document.getElementById("content");
  const error = document.getElementById("error");
  const statusIndicator = document.getElementById("status-indicator");
  const statusText = statusIndicator.querySelector(".status-text");

  try {
    const config = await new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_CONFIG, resolve);
    });

    document.getElementById("enable-toggle").checked = config.enabled;
    document.getElementById("threshold-tokens").textContent = formatTokens(config.tokenThreshold);

    const response = await fetch(`${config.serverUrl}/usage`);
    if (!response.ok) throw new Error("Server error");
    
    const usage = await response.json();

    statusIndicator.className = "status-indicator connected";
    statusText.textContent = "SYSTEM_ONLINE";

    const currentTokens = usage.total?.totalTokens ?? 0;
    const threshold = config.tokenThreshold;
    const progress = Math.min(100, (currentTokens / threshold) * 100);

    document.getElementById("current-tokens").textContent = formatTokens(currentTokens);
    document.getElementById("progress-percentage").textContent = `${Math.round(progress)}%`;
    document.getElementById("progress-fill").style.width = `${progress}%`;

    const breakdownEl = document.getElementById("breakdown");
    const availableBreakdown = (usage.breakdown || []).filter(b => b.available);
    
    if (availableBreakdown.length > 0) {
      const headerHtml = `
        <div class="breakdown-header">
          <span>SOURCE_DATA</span>
          <span>TOKENS</span>
        </div>`;
        
      const itemsHtml = availableBreakdown.map(b => `
        <div class="breakdown-item">
          <span class="breakdown-name">${b.displayName.toUpperCase().replace(" ", "_")}</span>
          <span class="breakdown-tokens">${formatTokens(b.totalTokens)}</span>
        </div>
      `).join("");
      
      breakdownEl.innerHTML = headerHtml + itemsHtml;
      breakdownEl.classList.remove("hidden");
    } else {
      breakdownEl.classList.add("hidden");
    }

    loading.classList.add("hidden");
    content.classList.remove("hidden");
    error.classList.add("hidden");

  } catch (err) {
    statusIndicator.className = "status-indicator disconnected";
    statusText.textContent = "OFFLINE";
    
    loading.classList.add("hidden");
    content.classList.add("hidden");
    error.classList.remove("hidden");
    document.getElementById("error-message").textContent = "FATAL_ERROR: SERVER_UNREACHABLE";
  }
}

document.getElementById("enable-toggle").addEventListener("change", async (e) => {
  const enabled = e.target.checked;
  await new Promise((resolve) => {
    chrome.storage.sync.set({ enabled }, resolve);
  });
});

document.getElementById("settings-link").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

loadData();
setInterval(loadData, 5000);
