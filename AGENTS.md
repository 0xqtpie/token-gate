# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-01
**Commit:** 35fc989
**Branch:** main

## OVERVIEW

TokenGate blocks distracting websites until daily AI coding token goals are met. Bun + Hono server aggregates usage from Claude Code, OpenCode, Codex; Chrome extension enforces blocking.

## STRUCTURE

```
token-gate/
├── packages/
│   ├── extension/     # Chrome MV3 extension (vanilla JS, no build)
│   └── server/        # Bun + Hono server with CLI service management
├── scripts/           # Shared build utilities (icon generation)
├── SPEC.md            # Full technical specification
└── TODO.md            # Development roadmap
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Server endpoints | `packages/server/src/server.ts` | Hono routes: /usage, /health |
| Add new AI tool | `packages/server/src/adapters/` | Implement UsageAdapter interface |
| CLI commands | `packages/server/src/cli/index.ts` | run/install/start/stop/status |
| Platform services | `packages/server/src/cli/services/` | macos.ts, linux.ts, windows.ts |
| Blocking logic | `packages/extension/background.js` | webNavigation listener |
| Overlay UI | `packages/extension/content.js` | DOM injection on blocked sites |
| Extension settings | `packages/extension/options.js` | chrome.storage.sync |

## CONVENTIONS

### Runtime (Bun preferred, Node.js supported)
- Server works with both `bun` and `node` (auto-detects)
- Package runner: `bunx` preferred, falls back to `npx`
- Development: `bun run` preferred, `npm run` works
- `Bun.serve()` with `node:http` fallback
- `bun test` for testing (Bun's built-in runner)
- Bun auto-loads .env (use dotenv with Node.js if needed)

### TypeScript (Server)
- Bundler module resolution
- Strict mode enabled
- `.js` extensions in imports (required for ESM)

### Extension
- Vanilla JS only (no TypeScript, no build step)
- Chrome MV3 manifest
- Service worker in background.js

### Imports
```typescript
// Server: Always use .js extension even for .ts files
import { foo } from "./bar.js";
```

## ANTI-PATTERNS (THIS PROJECT)

| Pattern | Why Forbidden |
|---------|---------------|
| `express`, `ws` | Use Hono + native APIs |
| TypeScript in extension | No build step, vanilla JS only |
| Blocking when server offline | Sites stay accessible with warning |
| Hardcoding `bunx` or `npx` | Use `getPackageRunner()` from exec.ts |

## COMMANDS

```bash
# Development (bun preferred, npm works)
bun run dev          # Server with hot reload
bun run typecheck    # TypeScript check

# Production
bun run start        # Start server (or: npm run start)
bun run --cwd packages/server build  # Build server

# Server CLI (works with bunx or npx)
bunx tokengate-server run   # or: npx tokengate-server run
tokengate-server install    # Install as background service
tokengate-server status     # Check status
```

## CONFIGURATION

| Env Var | Default | Description |
|---------|---------|-------------|
| `PORT` | 3847 | Server port |
| `CACHE_TTL` | 30 | Usage cache seconds |
| `ADAPTERS` | all | claude-code,opencode,codex |

## NOTES

- Server runs on localhost:3847, extension polls /usage endpoint
- 24-hour token period: midnight-to-midnight local time
- No bypass mechanism by design
- Extension needs manual load in chrome://extensions (no web store)
- Adapters call external CLIs: ccusage, opencode stats
- No tests implemented yet (TODO.md Phase 11)
