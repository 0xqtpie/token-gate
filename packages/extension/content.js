let overlayElement = null;

function formatTokens(num) {
  return num.toLocaleString();
}

function calculateProgress(current, total) {
  return Math.min(100, (current / total) * 100);
}

function createBlockOverlay(data) {
  if (overlayElement) return;
  
  const { currentTokens, threshold, breakdown } = data;
  const progress = calculateProgress(currentTokens, threshold);
  
  overlayElement = document.createElement("div");
  overlayElement.id = "tokengate-overlay";
  overlayElement.innerHTML = `
    <div class="tokengate-card">
      <div class="tokengate-icon">🚫</div>
      <h1 class="tokengate-title">Get back to work!</h1>
      <p class="tokengate-subtitle">You haven't hit your token goal yet.</p>
      
      <div class="tokengate-progress-container">
        <div class="tokengate-progress-bar">
          <div class="tokengate-progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="tokengate-progress-text">
          ${formatTokens(currentTokens)} / ${formatTokens(threshold)} tokens
        </div>
      </div>
      
      ${breakdown && breakdown.length > 0 ? `
        <div class="tokengate-breakdown">
          ${breakdown
            .filter(b => b.available)
            .map(b => `
              <div class="tokengate-breakdown-item">
                <span class="tokengate-breakdown-name">${b.displayName}:</span>
                <span class="tokengate-breakdown-tokens">${formatTokens(b.totalTokens)} tokens</span>
              </div>
            `).join("")}
        </div>
      ` : ""}
      
      <div class="tokengate-actions">
        <button class="tokengate-btn tokengate-btn-secondary" id="tokengate-settings">
          Open Settings
        </button>
        <button class="tokengate-btn tokengate-btn-primary" id="tokengate-refresh">
          Refresh
        </button>
      </div>
    </div>
  `;
  
  document.documentElement.appendChild(overlayElement);
  
  document.getElementById("tokengate-settings").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
  });
  
  document.getElementById("tokengate-refresh").addEventListener("click", () => {
    window.location.reload();
  });
}

function createNotConnectedOverlay(serverUrl) {
  if (overlayElement) return;
  
  overlayElement = document.createElement("div");
  overlayElement.id = "tokengate-overlay";
  overlayElement.className = "tokengate-warning";
  overlayElement.innerHTML = `
    <div class="tokengate-card">
      <div class="tokengate-icon">⚠️</div>
      <h1 class="tokengate-title">TokenGate Server Not Running</h1>
      <p class="tokengate-subtitle">
        Cannot connect to ${serverUrl}
      </p>
      
      <div class="tokengate-help">
        <p>Start the server by running:</p>
        <code>bunx tokengate-server</code>
      </div>
      
      <div class="tokengate-actions">
        <button class="tokengate-btn tokengate-btn-secondary" id="tokengate-settings">
          Open Settings
        </button>
        <button class="tokengate-btn tokengate-btn-primary" id="tokengate-refresh">
          Retry
        </button>
      </div>
    </div>
  `;
  
  document.documentElement.appendChild(overlayElement);
  
  document.getElementById("tokengate-settings").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
  });
  
  document.getElementById("tokengate-refresh").addEventListener("click", () => {
    window.location.reload();
  });
}

function removeOverlay() {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_BLOCK") {
    createBlockOverlay(message);
  } else if (message.type === "SHOW_NOT_CONNECTED") {
    createNotConnectedOverlay(message.serverUrl);
  } else if (message.type === "HIDE_BLOCK") {
    removeOverlay();
  }
});
