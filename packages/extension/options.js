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

let currentConfig = { ...DEFAULT_CONFIG };

function renderDomainList() {
  const container = document.getElementById("domain-list");
  container.innerHTML = currentConfig.blockedDomains.map(domain => `
    <div class="domain-tag">
      <span>${domain}</span>
      <button class="remove-btn" data-domain="${domain}">&times;</button>
    </div>
  `).join("");

  container.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const domain = btn.dataset.domain;
      removeDomain(domain);
    });
  });
}

function addDomain(domain) {
  domain = domain.trim().toLowerCase();
  if (!domain) return;
  
  domain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  
  if (currentConfig.blockedDomains.includes(domain)) return;
  
  currentConfig.blockedDomains.push(domain);
  renderDomainList();
}

function removeDomain(domain) {
  currentConfig.blockedDomains = currentConfig.blockedDomains.filter(d => d !== domain);
  renderDomainList();
}

async function testConnection() {
  const serverUrl = document.getElementById("server-url-input").value;
  const statusEl = document.getElementById("connection-status");
  
  statusEl.className = "connection-status";
  statusEl.textContent = "Testing...";
  statusEl.style.display = "block";
  
  try {
    const response = await fetch(`${serverUrl}/health`);
    if (!response.ok) throw new Error("Server error");
    
    const data = await response.json();
    statusEl.className = "connection-status success";
    statusEl.textContent = `UPLINK_ESTABLISHED // V${data.version} // ADAPTERS: ${data.adapters.join(", ").toUpperCase()}`;
  } catch (err) {
    statusEl.className = "connection-status error";
    statusEl.textContent = "CONNECTION_FAILURE: CHECK_SERVER_PROCESS";
  }
}

async function saveSettings() {
  currentConfig.tokenThreshold = parseInt(document.getElementById("threshold-input").value, 10) || 50000;
  currentConfig.serverUrl = document.getElementById("server-url-input").value;
  currentConfig.enabled = document.getElementById("enable-toggle").checked;
  
  await new Promise((resolve) => {
    chrome.storage.sync.set(currentConfig, resolve);
  });
  
  const statusEl = document.getElementById("save-status");
  statusEl.textContent = "CONFIGURATION_COMMITTED";
  statusEl.classList.add("visible");
  
  setTimeout(() => {
    statusEl.classList.remove("visible");
  }, 2000);
}

async function loadSettings() {
  currentConfig = await new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, resolve);
  });
  
  document.getElementById("enable-toggle").checked = currentConfig.enabled;
  document.getElementById("threshold-input").value = currentConfig.tokenThreshold;
  document.getElementById("server-url-input").value = currentConfig.serverUrl;
  renderDomainList();
}

document.getElementById("add-domain-btn").addEventListener("click", () => {
  const input = document.getElementById("new-domain-input");
  addDomain(input.value);
  input.value = "";
});

document.getElementById("new-domain-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const input = document.getElementById("new-domain-input");
    addDomain(input.value);
    input.value = "";
  }
});

document.querySelectorAll("[data-domain]").forEach(btn => {
  btn.addEventListener("click", () => {
    addDomain(btn.dataset.domain);
  });
});

document.getElementById("test-connection-btn").addEventListener("click", testConnection);
document.getElementById("save-btn").addEventListener("click", saveSettings);

loadSettings();
