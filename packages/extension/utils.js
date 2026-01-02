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
    "pornhub.com",
  ],
  tokenThreshold: 50000,
  serverUrl: "http://localhost:3847",
  enabled: true,
};

async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, (config) => {
      resolve(config);
    });
  });
}

async function setConfig(config) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(config, resolve);
  });
}

function getDefaultConfig() {
  return { ...DEFAULT_CONFIG };
}

async function fetchUsage(serverUrl) {
  const response = await fetch(`${serverUrl}/usage`);
  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }
  return response.json();
}

function matchDomain(hostname, patterns) {
  const normalizedHostname = hostname.toLowerCase().replace(/^www\./, "");

  for (const pattern of patterns) {
    const normalizedPattern = pattern.toLowerCase().replace(/^www\./, "");

    if (normalizedPattern.startsWith("*.")) {
      const suffix = normalizedPattern.slice(2);
      if (
        normalizedHostname === suffix ||
        normalizedHostname.endsWith("." + suffix)
      ) {
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

function formatTokens(num) {
  return num.toLocaleString();
}

function formatProgress(current, total) {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  return `${percentage}%`;
}

function calculateProgress(current, total) {
  return Math.min(100, (current / total) * 100);
}

function validateThreshold(value) {
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: "Threshold must be a positive number" };
  }
  return { valid: true, value: num };
}

function validateServerUrl(url) {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "Server URL is required" };
  }
  
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "URL must use http or https protocol" };
    }
    return { valid: true, value: url };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

function validateDomainPattern(pattern) {
  if (!pattern || typeof pattern !== "string") {
    return { valid: false, error: "Domain pattern is required" };
  }
  
  const trimmed = pattern.trim().toLowerCase();
  if (trimmed.length === 0) {
    return { valid: false, error: "Domain pattern cannot be empty" };
  }
  
  const domainRegex = /^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;
  if (!domainRegex.test(trimmed)) {
    return { valid: false, error: "Invalid domain pattern format" };
  }
  
  return { valid: true, value: trimmed };
}
