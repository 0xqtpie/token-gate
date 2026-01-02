# Privacy Policy for TokenGate

**Last Updated:** January 2, 2026

## Overview

TokenGate is a productivity Chrome extension that blocks distracting websites until you've met your daily AI coding token goals. This privacy policy explains how TokenGate handles your data.

**The short version:** TokenGate does not collect, transmit, or share any personal data. All data stays on your computer.

---

## Data Collection

### What We Collect

**Nothing.** TokenGate does not collect any personal information, usage data, or analytics.

### What We Store Locally

TokenGate stores the following data locally on your device using Chrome's `chrome.storage.sync` API:

| Data | Purpose |
|------|---------|
| Blocked domains list | Your list of websites to block (e.g., twitter.com, reddit.com) |
| Token threshold | Your daily token goal (default: 50,000) |
| Server URL | Local server address (default: http://localhost:3847) |
| Enabled state | Whether blocking is currently active |

This data:
- Is stored locally in your Chrome profile
- May sync across your Chrome browsers if you're signed into Chrome (via Chrome's built-in sync)
- Is never transmitted to any external servers
- Is never shared with third parties

---

## Permissions Explained

TokenGate requires certain Chrome permissions to function. Here's exactly what each permission does:

### `storage`
**Purpose:** Save your settings (blocked domains, token threshold, etc.)

This permission allows TokenGate to remember your preferences between browser sessions. Data is stored locally in your Chrome profile.

### `tabs`
**Purpose:** Check if the current tab's URL matches your blocked domains list

This permission allows TokenGate to read the URL of the active tab to determine if it should be blocked. We do not track, log, or transmit your browsing history.

### `webNavigation`
**Purpose:** Detect when you navigate to a blocked website

This permission allows TokenGate to intercept page loads and check if the destination is on your blocked list before the page fully loads.

### `host_permissions: <all_urls>`
**Purpose:** Display the blocking overlay on any website you've configured as blocked

This broad permission is required because you can block any domain of your choosing. The content script only activates on domains you've explicitly added to your blocked list.

### `host_permissions: http://localhost:3847/*`
**Purpose:** Communicate with the local TokenGate server

This permission allows the extension to fetch your token usage data from the TokenGate server running on your own computer. No data is sent to external servers.

---

## Network Communication

TokenGate communicates only with:

1. **localhost:3847** (or your configured local server URL)
   - Fetches your current token usage from AI coding tools
   - This is a server running on YOUR computer
   - No data leaves your machine

**TokenGate does NOT communicate with:**
- Any remote servers
- Any analytics services
- Any advertising networks
- Any third-party APIs

---

## Third-Party Services

TokenGate does not use any third-party services, analytics, or tracking.

The extension loads the "Space Mono" font from Google Fonts for the UI. This is the only external resource loaded, and it does not transmit any user data.

---

## Data Security

- All settings are stored locally using Chrome's secure storage APIs
- No data is transmitted over the network (except to localhost)
- No authentication credentials are stored
- No personal information is collected

---

## Children's Privacy

TokenGate does not knowingly collect any information from children under 13 years of age. The extension does not collect information from any users.

---

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last Updated" date at the top of this document. Significant changes will be noted in the extension's changelog.

---

## Your Rights

Since TokenGate doesn't collect any personal data, there's nothing to request, modify, or delete from our end. You can clear all TokenGate data by:

1. Right-clicking the TokenGate extension icon
2. Selecting "Options"
3. Clearing your settings, or
4. Removing the extension entirely

---

## Open Source

TokenGate is open source. You can review the complete source code to verify these privacy claims:

**Repository:** https://github.com/0xqtpie/token-gate

---

## Contact

If you have questions about this privacy policy or TokenGate's data practices, please open an issue on our GitHub repository:

https://github.com/0xqtpie/token-gate/issues

---

## Summary

| Question | Answer |
|----------|--------|
| Does TokenGate collect personal data? | No |
| Does TokenGate track browsing history? | No |
| Does TokenGate use analytics? | No |
| Does TokenGate share data with third parties? | No |
| Where is my data stored? | Locally on your device only |
| Does TokenGate communicate with external servers? | No, only localhost |
