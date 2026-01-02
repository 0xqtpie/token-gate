let overlayElement = null;
let currentState = null;

function formatTokens(num) {
  return num.toLocaleString();
}

function calculateProgress(current, total) {
  return Math.min(100, (current / total) * 100);
}

function createBlockOverlay(data) {
  removeOverlay();

  const { currentTokens, threshold } = data;
  const progress = calculateProgress(currentTokens, threshold);
  const progressPercent = Math.round(progress);

  overlayElement = document.createElement("div");
  overlayElement.id = "tokengate-overlay";
  overlayElement.innerHTML = `
    <div class="tokengate-card">
      <div class="tokengate-header">
        <span class="tokengate-brand">TOKENGATE</span>
        <div class="tokengate-status">
          <span class="tokengate-status-dot"></span>
          <span class="tokengate-status-text">ACCESS_DENIED</span>
        </div>
      </div>

      <h1 class="tokengate-title">[ GET_BACK_TO_WORK ]</h1>
      <p class="tokengate-subtitle">Token quota not reached</p>

      <div class="tokengate-progress-section">
        <div class="tokengate-progress-header">
          <span class="tokengate-progress-label">DAILY_QUOTA</span>
          <span class="tokengate-progress-percentage">${progressPercent}%</span>
        </div>
        <div class="tokengate-progress-track">
          <div class="tokengate-progress-fill" style="width: ${progress}%"></div>
          <div class="tokengate-progress-grid"></div>
        </div>
        <div class="tokengate-progress-stats">
          <div class="tokengate-stat-box">
            <span class="tokengate-stat-label">CURRENT</span>
            <span class="tokengate-stat-value">${formatTokens(
              currentTokens
            )}</span>
          </div>
          <span class="tokengate-stat-divider">/</span>
          <div class="tokengate-stat-box">
            <span class="tokengate-stat-label">TARGET</span>
            <span class="tokengate-stat-value">${formatTokens(threshold)}</span>
          </div>
        </div>
      </div>

      <div class="tokengate-actions">
        <button class="tokengate-btn tokengate-btn-secondary" id="tokengate-settings">
          [ CONFIG ]
        </button>
        <button class="tokengate-btn tokengate-btn-primary" id="tokengate-refresh">
          [ REFRESH ]
        </button>
      </div>
    </div>
  `;

  document.documentElement.appendChild(overlayElement);

  document
    .getElementById("tokengate-settings")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
    });

  document.getElementById("tokengate-refresh").addEventListener("click", () => {
    window.location.reload();
  });

  currentState = "blocked";
}

function createNotConnectedOverlay(serverUrl) {
  if (currentState === "not_connected") return;
  removeOverlay();

  overlayElement = document.createElement("div");
  overlayElement.id = "tokengate-overlay";
  overlayElement.className = "tokengate-warning";
  overlayElement.innerHTML = `
    <div class="tokengate-card">
      <div class="tokengate-header">
        <span class="tokengate-brand">TOKENGATE</span>
        <div class="tokengate-status">
          <span class="tokengate-status-dot"></span>
          <span class="tokengate-status-text">OFFLINE</span>
        </div>
      </div>

      <h1 class="tokengate-title">[ SERVER_OFFLINE ]</h1>
      <p class="tokengate-subtitle">Cannot connect to ${serverUrl}</p>

      <div class="tokengate-help">
        <span class="tokengate-help-label">Start server:</span>
        <code>bunx tokengate-server</code>
      </div>

      <div class="tokengate-actions">
        <button class="tokengate-btn tokengate-btn-secondary" id="tokengate-settings">
          [ CONFIG ]
        </button>
        <button class="tokengate-btn tokengate-btn-primary" id="tokengate-refresh">
          [ RETRY ]
        </button>
      </div>
    </div>
  `;

  document.documentElement.appendChild(overlayElement);

  document
    .getElementById("tokengate-settings")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
    });

  document.getElementById("tokengate-refresh").addEventListener("click", () => {
    window.location.reload();
  });

  currentState = "not_connected";
}

function updateBlockOverlay(data) {
  if (!overlayElement || currentState === "not_connected") {
    createBlockOverlay(data);
    return;
  }

  const { currentTokens, threshold } = data;
  const progress = calculateProgress(currentTokens, threshold);
  const progressPercent = Math.round(progress);

  const progressFill = overlayElement.querySelector(".tokengate-progress-fill");
  const progressPercentEl = overlayElement.querySelector(
    ".tokengate-progress-percentage"
  );
  const currentStat = overlayElement.querySelector(
    ".tokengate-stat-box:first-child .tokengate-stat-value"
  );

  if (progressFill) progressFill.style.width = `${progress}%`;
  if (progressPercentEl) progressPercentEl.textContent = `${progressPercent}%`;
  if (currentStat) currentStat.textContent = formatTokens(currentTokens);
}

function removeOverlay() {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
  currentState = null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_BLOCK") {
    createBlockOverlay(message);
  } else if (message.type === "UPDATE_BLOCK") {
    updateBlockOverlay(message);
  } else if (message.type === "SHOW_NOT_CONNECTED") {
    createNotConnectedOverlay(message.serverUrl);
  } else if (message.type === "HIDE_BLOCK") {
    removeOverlay();
  }
});
