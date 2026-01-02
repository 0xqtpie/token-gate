#!/usr/bin/env node
import { getServiceManager, DEFAULT_PORT } from "./services/index.js";

const HELP_TEXT = `
tokengate-server - Local server that aggregates token usage from AI coding tools

Usage:
  tokengate-server [command]

Commands:
  run         Run the server in foreground (default)
  install     Install and start as background service
  uninstall   Stop and remove the background service
  start       Start the background service
  stop        Stop the background service
  status      Check service status

Options:
  -h, --help     Show this help message
  -v, --version  Show version number

Examples:
  tokengate-server              # Run in foreground
  tokengate-server install      # Install as background service
  tokengate-server status       # Check if service is running
`;

async function runServer(): Promise<void> {
  const { createServer } = await import("../server.js");
  const { loadConfig } = await import("../config.js");

  const config = loadConfig();
  const app = createServer(config);

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    TokenGate Server                        ║
╠═══════════════════════════════════════════════════════════╣
║  Status:    Running                                        ║
║  Port:      ${String(config.port).padEnd(44)}║
║  Cache TTL: ${String(config.cacheTtl + "s").padEnd(44)}║
║                                                            ║
║  Endpoints:                                                ║
║    GET /health  - Health check                             ║
║    GET /usage   - Token usage data                         ║
╚═══════════════════════════════════════════════════════════╝
`);

  const hasBun = typeof Bun !== "undefined" && typeof Bun.serve === "function";
  
  if (hasBun) {
    Bun.serve({ port: config.port, fetch: app.fetch });
    console.log(`Started server: http://localhost:${config.port}`);
    return;
  }

  const { createServer: createHttpServer } = await import("node:http");
  const httpServer = createHttpServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${config.port}`);
    const request = new Request(url.toString(), {
      method: req.method,
      headers: req.headers as HeadersInit,
    });
    const response = await app.fetch(request);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    const body = await response.text();
    res.end(body);
  });
  httpServer.listen(config.port, () => {
    console.log(`Started server: http://localhost:${config.port}`);
  });
}

async function handleInstall(): Promise<void> {
  const manager = getServiceManager();
  await manager.install();

  console.log("✓ Created service configuration");
  console.log("✓ Started tokengate-server");
  console.log(`✓ Server running on http://localhost:${DEFAULT_PORT}`);
  console.log("");
  console.log("TokenGate will now start automatically when you log in.");
}

async function handleUninstall(): Promise<void> {
  const manager = getServiceManager();
  await manager.uninstall();

  console.log("✓ Stopped server");
  console.log("✓ Removed service configuration");
  console.log("");
  console.log("TokenGate server has been uninstalled.");
}

async function handleStart(): Promise<void> {
  const manager = getServiceManager();
  await manager.start();
  console.log("✓ TokenGate server started");
}

async function handleStop(): Promise<void> {
  const manager = getServiceManager();
  await manager.stop();
  console.log("✓ TokenGate server stopped");
}

async function handleStatus(): Promise<void> {
  const manager = getServiceManager();
  const status = await manager.status();

  console.log("TokenGate Server");

  if (!status.installed) {
    console.log("  Status:  ○ Not installed");
    console.log("");
    console.log("Run 'tokengate-server install' to install as a background service.");
    console.log("Or run 'tokengate-server run' to start in foreground.");
    return;
  }

  if (status.running) {
    console.log("  Status:  ● Running");
    if (status.pid) {
      console.log(`  PID:     ${status.pid}`);
    }
    console.log(`  URL:     http://localhost:${status.port || DEFAULT_PORT}`);
  } else {
    console.log("  Status:  ○ Stopped (installed)");
    console.log("");
    console.log("Run 'tokengate-server start' to start the server.");
  }

  if (status.logDir) {
    console.log(`  Logs:    ${status.logDir}`);
  }
}

function showHelp(): void {
  console.log(HELP_TEXT);
}

function showVersion(): void {
  console.log("tokengate-server v1.0.0");
}

export async function main(args: string[]): Promise<void> {
  const command = args[0] || "run";

  if (command === "-h" || command === "--help" || command === "help") {
    showHelp();
    return;
  }

  if (command === "-v" || command === "--version" || command === "version") {
    showVersion();
    return;
  }

  try {
    switch (command) {
      case "run":
        await runServer();
        break;
      case "install":
        await handleInstall();
        break;
      case "uninstall":
        await handleUninstall();
        break;
      case "start":
        await handleStart();
        break;
      case "stop":
        await handleStop();
        break;
      case "status":
        await handleStatus();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error("Run 'tokengate-server --help' for usage.");
        process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

declare const Bun: {
  serve: (options: { port: number; fetch: (req: Request) => Response | Promise<Response> }) => unknown;
};

const cliArgs = typeof process !== "undefined" ? process.argv.slice(2) : [];
main(cliArgs);
