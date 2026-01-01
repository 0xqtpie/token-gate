import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeFile, unlink, mkdir } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { ServiceManager, ServiceStatus, ServicePaths } from "./types.js";
import { SERVICE_NAME, DEFAULT_PORT } from "./types.js";
import {
  getServicePaths,
  ensureDirectories,
  copyServerFiles,
  cleanupServerFiles,
  findRuntime,
  isPortResponding,
} from "./paths.js";

const execAsync = promisify(exec);

export class MacOSServiceManager implements ServiceManager {
  private paths: ServicePaths;
  private plistPath: string;

  constructor() {
    this.paths = getServicePaths();
    this.plistPath = join(
      this.paths.homeDir,
      "Library/LaunchAgents",
      `${SERVICE_NAME}.plist`
    );
  }

  private generatePlist(runtime: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${SERVICE_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${runtime}</string>
        <string>${this.paths.serverEntry}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${join(this.paths.logsDir, "stdout.log")}</string>
    <key>StandardErrorPath</key>
    <string>${join(this.paths.logsDir, "stderr.log")}</string>
    <key>WorkingDirectory</key>
    <string>${this.paths.serverDir}</string>
</dict>
</plist>`;
  }

  async install(): Promise<void> {
    const status = await this.status();
    if (status.installed) {
      throw new Error(
        "TokenGate server is already installed.\n" +
          "Use 'tokengate-server status' to check if it's running."
      );
    }

    const runtime = findRuntime();
    await ensureDirectories(this.paths);
    await copyServerFiles(this.paths);

    const launchAgentsDir = join(this.paths.homeDir, "Library/LaunchAgents");
    await mkdir(launchAgentsDir, { recursive: true });

    const plist = this.generatePlist(runtime);
    await writeFile(this.plistPath, plist, "utf-8");

    await execAsync(`launchctl load "${this.plistPath}"`);
    await execAsync(`launchctl start ${SERVICE_NAME}`);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const running = await isPortResponding(DEFAULT_PORT);
    if (!running) {
      console.warn(
        "Warning: Server may not have started correctly. Check logs at:",
        this.paths.logsDir
      );
    }
  }

  async uninstall(): Promise<void> {
    const status = await this.status();
    if (!status.installed) {
      throw new Error("TokenGate server is not installed.\n" + "Nothing to uninstall.");
    }

    try {
      await execAsync(`launchctl stop ${SERVICE_NAME}`);
    } catch {}

    try {
      await execAsync(`launchctl unload "${this.plistPath}"`);
    } catch {}

    if (existsSync(this.plistPath)) {
      await unlink(this.plistPath);
    }

    await cleanupServerFiles(this.paths);
  }

  async start(): Promise<void> {
    const status = await this.status();
    if (!status.installed) {
      throw new Error(
        "TokenGate server is not installed.\n" + "Run 'tokengate-server install' first."
      );
    }

    if (status.running) {
      throw new Error("TokenGate server is already running.");
    }

    await execAsync(`launchctl start ${SERVICE_NAME}`);
  }

  async stop(): Promise<void> {
    const status = await this.status();
    if (!status.installed) {
      throw new Error(
        "TokenGate server is not installed.\n" + "Run 'tokengate-server install' first."
      );
    }

    if (!status.running) {
      throw new Error("TokenGate server is not running.");
    }

    await execAsync(`launchctl stop ${SERVICE_NAME}`);
  }

  async status(): Promise<ServiceStatus> {
    const installed = existsSync(this.plistPath);

    if (!installed) {
      return { installed: false, running: false };
    }

    let pid: number | undefined;
    let running = false;

    try {
      const { stdout } = await execAsync(`launchctl list | grep ${SERVICE_NAME}`);
      const parts = stdout.trim().split(/\s+/);
      if (parts[0] && parts[0] !== "-") {
        pid = parseInt(parts[0], 10);
        running = !isNaN(pid) && pid > 0;
      }
    } catch {}

    const portResponding = await isPortResponding(DEFAULT_PORT);
    running = running || portResponding;

    return {
      installed,
      running,
      pid,
      port: running ? DEFAULT_PORT : undefined,
      logDir: this.paths.logsDir,
    };
  }
}
