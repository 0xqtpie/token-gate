# tokengate-server

Local HTTP server that aggregates token usage from multiple AI coding tools.

## Installation

```bash
# Run without installing
bunx tokengate-server

# Or install globally
bun add -g tokengate-server
tokengate-server
```

## Usage

```bash
# Start with defaults (port 3847)
tokengate-server

# Custom port
PORT=8080 tokengate-server

# Custom cache TTL (seconds)
CACHE_TTL=60 tokengate-server

# Enable only specific adapters
ADAPTERS=claude-code,opencode tokengate-server
```

## API Endpoints

### GET /usage

Returns aggregated token usage for the current day (midnight-to-midnight local time).

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
    }
  ],
  "timestamp": "2025-01-01T15:30:00Z",
  "periodStart": "2025-01-01T00:00:00Z",
  "periodEnd": "2025-01-02T00:00:00Z",
  "cached": false
}
```

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "adapters": ["claude-code", "opencode", "codex"]
}
```

## Supported Tools

| Tool        | Adapter      | Command                              |
| ----------- | ------------ | ------------------------------------ |
| Claude Code | claude-code  | `ccusage daily --json`               |
| OpenCode    | opencode     | `opencode stats --days 1`            |
| Codex       | codex        | `@ccusage/codex daily --json`        |

## Configuration

| Environment Variable | Default | Description                              |
| -------------------- | ------- | ---------------------------------------- |
| `PORT`               | 3847    | Port to listen on                        |
| `CACHE_TTL`          | 30      | Seconds to cache usage data              |
| `ADAPTERS`           | all     | Comma-separated list of adapters to use  |

## Development

```bash
# Clone the repo
git clone https://github.com/yourusername/token-gate
cd token-gate/packages/server

# Install dependencies
bun install

# Run in dev mode (with hot reload)
bun run dev
```

## How It Works

1. The server starts and discovers which AI coding tools are installed
2. When `/usage` is requested, it runs each tool's CLI command
3. Results are parsed and aggregated
4. Response is cached for the configured TTL (default 30s)
5. Individual adapter failures don't break the whole response

## License

MIT
