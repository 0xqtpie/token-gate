# tokengate-extension

Chrome MV3 extension blocking sites until token goals met. Vanilla JS, no build step.

## STRUCTURE

```
extension/
├── manifest.json      # MV3 config, permissions, content scripts
├── background.js      # Service worker: navigation interception
├── content.js         # Blocking overlay injection
├── blocked.css        # Overlay styles
├── popup.html/js/css  # Toolbar popup (quick status)
├── options.html/js/css # Settings page
├── utils.js           # Shared: domain matching, API calls
└── icons/             # 16, 48, 128px PNGs
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Block decision | `background.js` | checkAndBlock(), webNavigation.onBeforeNavigate |
| Overlay UI | `content.js` | showBlockedOverlay() |
| Domain matching | `utils.js` | isDomainBlocked() supports wildcards |
| Settings storage | `options.js` | chrome.storage.sync |
| Popup refresh | `popup.js` | Auto-refreshes every 5s |

## DATA FLOW

```
Navigation → background.js checks domain
  ↓ blocked?
  → Fetch localhost:3847/usage
  → tokens < threshold?
  → Send message to content.js
  → content.js injects overlay
```

## STORAGE SCHEMA

```javascript
// chrome.storage.sync
{
  blockedDomains: ["twitter.com", "*.reddit.com"],
  tokenThreshold: 50000,
  serverUrl: "http://localhost:3847",
  enabled: true
}
```

## CONVENTIONS

- Vanilla JavaScript only (no TypeScript, no bundler)
- All files directly in extension/ (no src/ directory)
- Wildcards: `*.reddit.com` blocks all subdomains
- Offline = NOT blocked (with warning overlay)

## PERMISSIONS REQUIRED

| Permission | Purpose |
|------------|---------|
| storage | Save settings |
| tabs | Read current URL |
| webNavigation | Intercept navigation |
| host_permissions: localhost:3847 | Fetch token usage |
| host_permissions: <all_urls> | Inject content script |

## DEVELOPMENT

1. Load unpacked at chrome://extensions
2. Enable Developer Mode
3. Edit files, click reload icon
4. No build step needed
