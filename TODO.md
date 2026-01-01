# TokenGate Implementation TODO

> Block distracting websites until you've hit your daily AI coding token goals.

## Overview

This document tracks the implementation progress of TokenGate, consisting of:
1. **tokengate-server** - Bun + Hono HTTP server aggregating token usage
2. **tokengate-extension** - Chrome extension blocking configured domains

---

## Phase 1: Project Foundation

- [x] Create root `package.json` with Bun workspaces configuration
- [x] Create root `.gitignore`
- [x] Create root `README.md` with project overview
- [x] Initialize git repository

### Server Package Setup
- [x] Create `packages/server/package.json`
- [x] Create `packages/server/tsconfig.json`
- [x] Create `packages/server/README.md`

---

## Phase 2: Server Utilities

### Configuration
- [x] Create `packages/server/src/config.ts`
  - [x] Parse PORT (default: 3847)
  - [x] Parse CACHE_TTL (default: 30 seconds)
  - [x] Parse ADAPTERS (default: "all")
  - [x] Support environment variables
  - [x] Support CLI arguments

### Utilities
- [x] Create `packages/server/src/utils/exec.ts`
  - [x] Promise-based child_process wrapper
  - [x] Timeout support
  - [x] Error handling for missing commands

- [x] Create `packages/server/src/utils/date.ts`
  - [x] Get today's date in YYYYMMDD format
  - [x] Get period start/end timestamps (midnight-to-midnight local time)

### Cache
- [x] Create `packages/server/src/cache.ts`
  - [x] Generic TTL cache class
  - [x] `get()` method with expiration check
  - [x] `set()` method with timestamp
  - [x] `isValid()` method
  - [x] `clear()` method

---

## Phase 3: Adapters

### Types
- [x] Create `packages/server/src/adapters/types.ts`
  - [x] `UsageData` interface (inputTokens, outputTokens, totalTokens)
  - [x] `UsageAdapter` interface (name, displayName, check, getUsage)
  - [x] `AdapterResult` interface (includes available flag, error)

### Claude Code Adapter
- [x] Create `packages/server/src/adapters/claude-code.ts`
  - [x] Implement `check()` - verify ccusage is available
  - [x] Implement `getUsage()` - run `bunx ccusage daily --json --since YYYYMMDD`
  - [x] Parse JSON response
  - [x] Extract inputTokens, outputTokens from totals
  - [x] Calculate totalTokens = inputTokens + outputTokens
  - [x] Handle errors gracefully

### Codex Adapter
- [x] Create `packages/server/src/adapters/codex.ts`
  - [x] Implement `check()` - verify @ccusage/codex is available
  - [x] Implement `getUsage()` - run `bunx @ccusage/codex daily --json --since YYYYMMDD`
  - [x] Parse JSON response (same structure as ccusage)
  - [x] Handle errors gracefully

### OpenCode Adapter
- [x] Create `packages/server/src/adapters/opencode.ts`
  - [x] Implement `check()` - verify opencode command exists
  - [x] Implement `getUsage()` - run `opencode stats --days 1`
  - [x] Parse text output with regex
  - [x] Extract Input tokens line (handle K/M suffixes)
  - [x] Extract Output tokens line (handle K/M suffixes)
  - [x] Calculate totalTokens = inputTokens + outputTokens
  - [x] Handle errors gracefully

### Adapter Registry
- [x] Create `packages/server/src/adapters/index.ts`
  - [x] Export all adapters
  - [x] `getAdapters()` function returning enabled adapters
  - [x] `getAdapterByName()` function
  - [x] Filter adapters based on config

---

## Phase 4: Server Core

### Aggregator
- [x] Create `packages/server/src/aggregator.ts`
  - [x] `aggregateUsage()` function
  - [x] Run all adapter checks in parallel
  - [x] Run getUsage for available adapters in parallel
  - [x] Combine results into total + breakdown
  - [x] Handle individual adapter failures gracefully
  - [x] Return structured response

### Hono Server
- [x] Create `packages/server/src/server.ts`
  - [x] Initialize Hono app
  - [x] Add CORS middleware (allow localhost origins)
  - [x] Implement `GET /health` endpoint
    - [x] Return status, version, adapter names
  - [x] Implement `GET /usage` endpoint
    - [x] Check cache first
    - [x] Call aggregator if cache miss
    - [x] Store in cache
    - [x] Return response with cached flag
  - [x] Error handling middleware

### Entry Point
- [x] Create `packages/server/src/index.ts`
  - [x] Parse CLI arguments
  - [x] Load configuration
  - [x] Start server
  - [x] Log startup message with port

### CLI Binary
- [x] Create `packages/server/bin/tokengate-server.ts`
  - [x] Shebang for bun
  - [x] Import and run main

---

## Phase 5: Extension Foundation

### Manifest
- [x] Create `packages/extension/manifest.json`
  - [x] Manifest version 3
  - [x] Name, version, description
  - [x] Permissions: storage, tabs, webNavigation
  - [x] Host permissions: localhost:3847, all_urls
  - [x] Background service worker
  - [x] Content scripts configuration
  - [x] Action popup
  - [x] Options page
  - [x] Icons

### Icons
- [x] Create `packages/extension/icons/icon-16.png`
- [x] Create `packages/extension/icons/icon-48.png`
- [x] Create `packages/extension/icons/icon-128.png`
  - [x] Simple design: gradient background with "TG" text

### Shared Utilities
- [x] Create `packages/extension/utils.js`
  - [x] `getConfig()` - read from chrome.storage.sync
  - [x] `setConfig()` - write to chrome.storage.sync
  - [x] `getDefaultConfig()` - return default settings
  - [x] `fetchUsage(serverUrl)` - call server API
  - [x] `matchDomain(hostname, patterns)` - wildcard matching
  - [x] `formatTokens(number)` - format with commas
  - [x] `formatProgress(current, total)` - percentage string

---

## Phase 6: Extension Background

- [x] Create `packages/extension/background.js`
  - [x] Initialize default config on install
  - [x] Listen to `chrome.webNavigation.onBeforeNavigate`
  - [x] Extract hostname from URL
  - [x] Check if domain matches blocked list
  - [x] If matched, fetch usage from server
  - [x] Compare totalTokens against threshold
  - [x] If below threshold, send message to content script
  - [x] Handle server connection errors
  - [x] Handle extension disabled state

---

## Phase 7: Extension Content Script

### Styles
- [x] Create `packages/extension/blocked.css`
  - [x] Overlay container (fixed, full viewport, high z-index)
  - [x] Semi-transparent dark backdrop
  - [x] Centered content card
  - [x] Icon styling
  - [x] Heading styles
  - [x] Progress bar container and fill
  - [x] Token count text
  - [x] Breakdown list styles
  - [x] Button styles
  - [x] Animations (fade in)
  - [x] Responsive adjustments

### Content Script
- [x] Create `packages/extension/content.js`
  - [x] Listen for messages from background
  - [x] `showBlockOverlay(data)` function
    - [x] Create overlay DOM structure
    - [x] Inject icon, heading, message
    - [x] Create progress bar with percentage
    - [x] Show token breakdown by source
    - [x] Add "Open Settings" button
    - [x] Add "Refresh" button
  - [x] `hideBlockOverlay()` function
  - [x] Prevent page interaction when blocked
  - [x] Handle "not connected" state differently

---

## Phase 8: Extension Popup

### Popup HTML
- [x] Create `packages/extension/popup.html`
  - [x] DOCTYPE and basic structure
  - [x] Link to popup.css
  - [x] Header with logo/title
  - [x] Connection status indicator
  - [x] Token progress display
  - [x] Progress bar
  - [x] Enable/disable toggle
  - [x] Settings link
  - [x] Script include

### Popup Styles
- [x] Create `packages/extension/popup.css`
  - [x] Fixed width popup container
  - [x] Header styling
  - [x] Status indicator (connected/disconnected)
  - [x] Progress section styling
  - [x] Toggle switch styling
  - [x] Links and buttons
  - [x] Loading states

### Popup Logic
- [x] Create `packages/extension/popup.js`
  - [x] Load current config on open
  - [x] Fetch usage from server
  - [x] Update progress display
  - [x] Update connection status
  - [x] Handle toggle enable/disable
  - [x] Handle settings link click
  - [x] Auto-refresh every few seconds while open

---

## Phase 9: Extension Options Page

### Options HTML
- [x] Create `packages/extension/options.html`
  - [x] DOCTYPE and full page structure
  - [x] Link to options.css
  - [x] Page header
  - [x] Blocked Domains section
    - [x] Current domains list with remove buttons
    - [x] Add domain input and button
    - [x] Recommended domains quick-add
  - [x] Token Threshold section
    - [x] Number input
    - [x] Helper text
  - [x] Server Configuration section
    - [x] URL input
    - [x] Test connection button
    - [x] Connection status display
  - [x] Enable/Disable toggle
  - [x] Save button
  - [x] Script include

### Options Styles
- [x] Create `packages/extension/options.css`
  - [x] Page layout (max-width, centered)
  - [x] Section card styling
  - [x] Form input styling
  - [x] Domain list styling
  - [x] Domain tag/chip styling with remove button
  - [x] Recommended domains buttons
  - [x] Toggle switch styling
  - [x] Button styling (primary, secondary, danger)
  - [x] Status messages (success, error)
  - [x] Responsive layout

### Options Logic
- [x] Create `packages/extension/options.js`
  - [x] Load config on page load
  - [x] Render blocked domains list
  - [x] Handle add domain (with validation)
  - [x] Handle remove domain
  - [x] Handle recommended domain click
  - [x] Handle threshold change
  - [x] Handle server URL change
  - [x] Handle test connection
  - [x] Handle enable/disable toggle
  - [x] Handle save (with feedback)
  - [x] Validate inputs before saving

---

## Phase 10: Documentation & Polish

### Server Documentation
- [x] Update `packages/server/README.md`
  - [x] Installation instructions (global, bunx)
  - [x] Configuration options
  - [x] API documentation
  - [x] Development instructions
  - [x] Adapter information

### Extension Documentation
- [x] Create `packages/extension/README.md`
  - [x] Installation instructions (load unpacked)
  - [x] Configuration guide
  - [x] How it works
  - [x] Troubleshooting

### Root Documentation
- [x] Update root `README.md`
  - [x] Project overview
  - [x] Quick start guide
  - [x] Architecture diagram
  - [x] Links to component READMEs
  - [x] Contributing guidelines

---

## Phase 11: Testing & Verification

### Server Testing
- [x] Test server starts correctly
- [x] Test /health endpoint
- [x] Test /usage endpoint with mocked adapters
- [ ] Test cache behavior (TTL expiration)
- [ ] Test Claude Code adapter with real ccusage
- [x] Test OpenCode adapter with real opencode
- [ ] Test Codex adapter (if available)
- [x] Test error handling for missing tools
- [ ] Test CORS headers work for extension

### Extension Testing
- [ ] Load extension in Chrome
- [ ] Verify icons display correctly
- [ ] Test popup shows correct status
- [ ] Test options page saves settings
- [ ] Test domain blocking works
- [ ] Test wildcard domain matching
- [ ] Test progress bar updates
- [ ] Test "not connected" state when server is down
- [ ] Test blocking overlay appears correctly
- [ ] Test overlay buttons work
- [ ] Test enable/disable toggle

### Integration Testing
- [ ] Full flow: server running + extension blocking
- [ ] Verify tokens update in real-time
- [ ] Verify unblock when threshold reached
- [ ] Test with multiple AI tools active

---

## Discovered Issues / Notes

- Icon generation requires `sharp` package (added as dev dependency)
- OpenCode adapter parses text output (no --json flag available)
- Server tested successfully with OpenCode returning real token data
- Service management tested on macOS: install, start, stop, status, uninstall all work correctly
- LaunchAgent KeepAlive behavior: stop command triggers auto-restart (by design)

---

## Completion Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | ✅ Complete | All files created |
| Phase 2: Utilities | ✅ Complete | Config, exec, date, cache |
| Phase 3: Adapters | ✅ Complete | claude-code, opencode, codex |
| Phase 4: Server Core | ✅ Complete | Aggregator, Hono server, entry point |
| Phase 5: Extension Foundation | ✅ Complete | Manifest, icons, utils |
| Phase 6: Background | ✅ Complete | Service worker with navigation handling |
| Phase 7: Content Script | ✅ Complete | Blocking overlay with styles |
| Phase 8: Popup | ✅ Complete | Status popup with toggle |
| Phase 9: Options Page | ✅ Complete | Full settings page |
| Phase 10: Documentation | ✅ Complete | READMEs for all components |
| Phase 11: Testing | 🟡 Partial | Server tested, extension needs manual testing |

---

_Last Updated: 2026-01-01_
