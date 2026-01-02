# tokengate-server

Local Hono server aggregating AI tool token usage. Works with both Bun and Node.js (auto-detects).

## STRUCTURE

```
server/
├── bin/tokengate-server.ts   # Entry point (just imports cli)
├── src/
│   ├── index.ts              # Bun.serve export
│   ├── server.ts             # Hono app, /usage + /health routes
│   ├── config.ts             # Env var loading
│   ├── cache.ts              # TTL cache for CLI results
│   ├── aggregator.ts         # Combines adapter results
│   ├── adapters/             # AI tool integrations
│   │   ├── types.ts          # UsageAdapter interface
│   │   ├── claude-code.ts    # ccusage CLI
│   │   ├── opencode.ts       # opencode stats CLI
│   │   ├── codex.ts          # @ccusage/codex CLI
│   │   └── index.ts          # Adapter registry
│   ├── cli/
│   │   ├── index.ts          # CLI main: run/install/start/stop/status
│   │   └── services/         # Platform-specific service managers
│   │       ├── macos.ts      # LaunchAgent
│   │       ├── linux.ts      # systemd user service
│   │       ├── windows.ts    # Scheduled Task + VBS
│   │       └── paths.ts      # ~/.tokengate/ directories
│   └── utils/
│       ├── date.ts           # Midnight boundaries
│       └── exec.ts           # Child process wrapper
└── dist/                     # Build output (tsc)
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Add AI tool | `src/adapters/` | Implement UsageAdapter, add to index.ts |
| Modify /usage response | `src/aggregator.ts` | AggregatedUsage type |
| Change cache behavior | `src/cache.ts` | TTL-based Map cache |
| Add CLI command | `src/cli/index.ts` | Switch statement in main() |
| Platform service | `src/cli/services/` | Extend ServiceManager interface |

## ADAPTER PATTERN

```typescript
interface UsageAdapter {
  name: string;           // "claude-code"
  displayName: string;    // "Claude Code"
  check(): Promise<boolean>;           // Tool installed?
  getUsage(): Promise<UsageData>;      // Today's tokens
}

interface UsageData {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
```

Each adapter:
1. Checks if CLI tool exists (which/where)
2. Executes CLI command with JSON output
3. Parses and normalizes response
4. Returns zeros if unavailable (never throws)

## CLI SERVICE MANAGEMENT

| Platform | Method | Location |
|----------|--------|----------|
| macOS | LaunchAgent | ~/Library/LaunchAgents/com.tokengate.server.plist |
| Linux | systemd --user | ~/.config/systemd/user/tokengate-server.service |
| Windows | Scheduled Task | VBS wrapper for hidden window |

Logs: `~/.tokengate/logs/`

## CONVENTIONS

- `.js` extension in all imports (ESM)
- Adapters NEVER throw - return zeros with available:false
- CLI uses dynamic imports to defer heavy modules
- `Bun?.serve?.()` with `node:http` fallback for Node.js compatibility
- `getPackageRunner()` returns `bunx` or `npx` based on availability
- `findRuntime()` returns `bun` or `node` path for service installation

## COMMANDS

```bash
bun run dev        # Hot reload server
bun run build      # tsc to dist/
bun run typecheck  # Type check only
```
