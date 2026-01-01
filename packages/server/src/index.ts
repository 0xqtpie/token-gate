import { createServer } from "./server.js";
import { loadConfig } from "./config.js";

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

export default {
  port: config.port,
  fetch: app.fetch,
};
