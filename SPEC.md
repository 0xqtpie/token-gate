# TokenGate - Technical Specification

> Block distracting websites until you've hit your daily AI coding token goals.

## Overview

TokenGate consists of two components:

1. **tokengate-server** - A local Bun + Hono HTTP server that aggregates token usage from multiple AI coding tools
2. **tokengate-extension** - A Chrome extension that blocks configured domains until a token threshold is met

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Machine                           │
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │ Claude Code │   │  OpenCode   │   │    Codex    │           │
│  │   (local)   │   │   (local)   │   │   (local)   │           │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘           │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  tokengate-server                        │   │
│  │                  localhost:3847                          │   │
│  │                                                          │   │
│  │  Polls CLI tools:                                        │   │
│  │  - ccusage (Claude Code)                                 │   │
│  │  - ccusage/codex (Codex)                                 │   │
│  │  - opencode stats (OpenCode)                             │   │
│  │                                                          │   │
│  │  Exposes: GET /usage → { total, breakdown, timestamp }   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              │ HTTP                             │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 tokengate-extension                      │   │
│  │                                                          │   │
│  │  - Fetches localhost:3847/usage on navigation            │   │
│  │  - Blocks configured domains if tokens < threshold       │   │
│  │  - Shows overlay: "X / Y tokens - get back to work!"     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component 1: tokengate-server

### Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Installation**: `bunx tokengate-server` or `bun add -g tokengate-server`

### CLI Tool Integration

Each supported tool has an adapter that knows how to:

1. Check if the tool is installed
2. Execute the appropriate command
3. Parse the output into a normalized format

#### Adapter Interface

```typescript
interface UsageAdapter {
  name: string; // e.g., "claude-code", "opencode", "codex"
  displayName: string; // e.g., "Claude Code", "OpenCode", "Codex"
  check(): Promise<boolean>; // Is this tool installed/available?
  getUsage(): Promise<UsageData>; // Get today's token usage
}

interface UsageData {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
```

#### Supported Adapters (v1)

| Tool        | Command                 | Notes                           |
| ----------- | ----------------------- | ------------------------------- |
| Claude Code | `ccusage --json`        | Uses ccusage npm package        |
| Codex       | `ccusage/codex --json`  | Uses @ccusage/codex npm package |
| OpenCode    | `opencode stats --json` | Built-in command                |

### API Endpoints

#### `GET /usage`

Returns aggregated token usage for the current 24-hour period.

**Response:**

```json
{
  "total": {
    "inputTokens": 45000,
    "outputTokens": 12000,
    "totalTokens": 57000
  },
  "breakdown": [
    {
      "source": "claude-code",
      "displayName": "Claude Code",
      "inputTokens": 30000,
      "outputTokens": 8000,
      "totalTokens": 38000,
      "available": true
    },
    {
      "source": "opencode",
      "displayName": "OpenCode",
      "inputTokens": 15000,
      "outputTokens": 4000,
      "totalTokens": 19000,
      "available": true
    },
    {
      "source": "codex",
      "displayName": "Codex",
      "inputTokens": 0,
      "outputTokens": 0,
      "totalTokens": 0,
      "available": false,
      "error": "ccusage/codex not installed"
    }
  ],
  "timestamp": "2025-01-01T15:30:00Z",
  "periodStart": "2025-01-01T00:00:00Z",
  "periodEnd": "2025-01-02T00:00:00Z"
}
```

#### `GET /health`

Simple health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "adapters": ["claude-code", "opencode", "codex"]
}
```

### Server Configuration

The server runs with sensible defaults but can be configured via environment variables or CLI flags:

| Option      | Default | Description                                |
| ----------- | ------- | ------------------------------------------ |
| `PORT`      | 3847    | Port to listen on                          |
| `CACHE_TTL` | 30      | Seconds to cache usage data                |
| `ADAPTERS`  | all     | Comma-separated list of adapters to enable |

### Caching Strategy

- Cache CLI results for 30 seconds to avoid hammering the filesystem
- Return cached data with `cached: true` flag
- Extension can poll frequently without performance concerns

### Directory Structure

```
tokengate-server/
├── src/
│   ├── index.ts              # Entry point, Hono app setup
│   ├── adapters/
│   │   ├── types.ts          # Adapter interface
│   │   ├── claude-code.ts    # ccusage adapter
│   │   ├── opencode.ts       # opencode stats adapter
│   │   ├── codex.ts          # ccusage/codex adapter
│   │   └── index.ts          # Adapter registry
│   ├── aggregator.ts         # Combines all adapter results
│   └── cache.ts              # Simple TTL cache
├── package.json
├── tsconfig.json
└── README.md
```

---

## Component 2: tokengate-extension

### Tech Stack

- **Manifest**: V3
- **Build**: None required (vanilla JS to start, can add bundler later)

### Features (v1)

1. **Domain Blocking**

   - User configures list of domains to block (e.g., twitter.com, reddit.com)
   - Supports wildcards: `*.reddit.com`

2. **Token Threshold**

   - User sets minimum total tokens required (e.g., 50,000)
   - Based on 24-hour rolling period

3. **Blocking Overlay**

   - Full-page overlay when visiting blocked domain
   - Shows current progress: "12,450 / 50,000 tokens"
   - Progress bar visualization
   - "Get back to work!" message
   - Optional: Shows breakdown by tool

4. **Settings Page**
   - Add/remove blocked domains
   - Set token threshold
   - Configure server URL (default: http://localhost:3847)
   - Test connection button

### Extension Structure

```
tokengate-extension/
├── manifest.json
├── background.js         # Service worker, checks usage on navigation
├── content.js            # Injects blocking overlay
├── blocked.html          # Overlay content (injected as iframe or direct DOM)
├── blocked.css           # Overlay styles
├── options.html          # Settings page
├── options.js            # Settings logic
├── popup.html            # Quick status popup
├── popup.js              # Popup logic
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### Manifest.json

```json
{
  "manifest_version": 3,
  "name": "TokenGate",
  "version": "1.0.0",
  "description": "Block distracting sites until you hit your daily coding token goals",

  "permissions": ["storage", "tabs", "webNavigation"],

  "host_permissions": ["http://localhost:3847/*", "<all_urls>"],

  "background": {
    "service_worker": "background.js"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["blocked.css"],
      "run_at": "document_start"
    }
  ],

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },

  "options_page": "options.html",

  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

### Data Flow

```
User navigates to twitter.com
         │
         ▼
┌─────────────────────────────────┐
│ background.js                   │
│ webNavigation.onBeforeNavigate  │
└───────────────┬─────────────────┘
                │
                ▼
        Is domain blocked?
       (check against config)
                │
        ┌───────┴───────┐
        │ No            │ Yes
        ▼               ▼
    Allow page    Fetch localhost:3847/usage
                        │
                        ▼
                tokens >= threshold?
                        │
                ┌───────┴───────┐
                │ Yes           │ No
                ▼               ▼
            Allow page    Send message to content.js
                                │
                                ▼
                        Show blocking overlay
```

### Storage Schema

```typescript
interface TokenGateConfig {
  blockedDomains: string[]; // ["twitter.com", "reddit.com", "*.youtube.com"]
  tokenThreshold: number; // 50000
  serverUrl: string; // "http://localhost:3847"
  enabled: boolean; // true
}

// Stored in chrome.storage.sync
```

### Blocking Overlay Design

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                         🚫                                  │
│                                                             │
│                  Get back to work!                          │
│                                                             │
│          You haven't hit your token goal yet.               │
│                                                             │
│         ┌─────────────────────────────────────┐             │
│         │████████████░░░░░░░░░░░░░░░░░░░░░░░░│             │
│         └─────────────────────────────────────┘             │
│                  12,450 / 50,000 tokens                     │
│                                                             │
│         ┌─────────────────────────────────────┐             │
│         │ Claude Code:  8,200 tokens          │             │
│         │ OpenCode:     4,250 tokens          │             │
│         └─────────────────────────────────────┘             │
│                                                             │
│              [Open Settings]  [Refresh]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation & Usage

### For Users

**Step 1: Install and run the server**

```bash
# One-time install
bun add -g tokengate-server

# Run (keep this running in background)
tokengate-server

# Or use bunx without installing
bunx tokengate-server
```

**Step 2: Install the extension**

- Download from Chrome Web Store (future)
- Or load unpacked from local directory

**Step 3: Configure**

- Click extension icon → Settings
- Add domains to block
- Set your token threshold
- Start coding!

### For Development

```bash
# Clone repo
git clone https://github.com/yourname/tokengate
cd tokengate

# Server development
cd packages/server
bun install
bun run dev

# Extension development
cd packages/extension
# Load unpacked in chrome://extensions
```

---

## Future Enhancements (v2+)

### Additional Adapters

- [ ] Aider (via .aider.costs.json)
- [ ] Cursor (if API becomes available)
- [ ] Cody (via Sourcegraph API)
- [ ] Generic OpenRouter adapter
- [ ] Custom webhook adapter

### Extension Features

- [ ] Time-based rules (only block during work hours)
- [ ] Streak tracking and stats
- [ ] "Focus mode" - temporary stricter blocking
- [ ] Multiple threshold profiles
- [ ] Daily/weekly token goals with history
- [ ] Browser notifications when goal is reached
- [ ] Whitelist for specific paths (allow reddit.com/r/programming)

### Server Features

- [ ] Historical usage tracking
- [ ] WebSocket for real-time updates
- [ ] System tray app wrapper for easier running
- [ ] Auto-start on boot option

### Distribution

- [ ] Chrome Web Store listing
- [ ] npm package for server
- [ ] Homebrew formula
- [ ] One-line install script

---

## Design Decisions

| Decision                 | Choice                                                             |
| ------------------------ | ------------------------------------------------------------------ |
| Token type for threshold | Total tokens                                                       |
| 24-hour period           | Midnight-to-midnight local time                                    |
| Offline behavior         | Show "not connected" message with setup instructions (not blocked) |
| Bypass mechanism         | None                                                               |
| Browser support          | Chrome only                                                        |
