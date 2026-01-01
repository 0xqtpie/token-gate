import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeFile, unlink, mkdir } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { ServiceManager, ServiceStatus, ServicePaths } from "./types.js";
import { DEFAULT_PORT } from "./types.js";
import {
  getServicePaths,
  ensureDirectories,
  copyServerFiles,
  cleanupServerFiles,
  findRuntime,
  isPortResponding,
} from "./paths.js";

const execAsync = promisify(exec);
const SERVICE_FILE_NAME = "tokengate-server.service";

export class LinuxServiceManager implements ServiceManager {
  private paths: ServicePaths;
  private serviceFilePath: string;

  constructor() {
    this.paths = getServicePaths();
    this.serviceFilePath = join(
      this.paths.homeDir,
      ".config/systemd/user",
      SERVICE_FILE_NAME
    );
  }

  private generateServiceFile(runtime: string): string {
    return `[Unit]
Description=TokenGate Server
After=network.target

[Service]
Type=simple
ExecStart=${runtime} ${this.paths.serverEntry}
Restart=always
RestartSec=5
StandardOutput=append:${join(this.paths.logsDir, "stdout.log")}
StandardError=append:${join(this.paths.logsDir, "stderr.log")}
WorkingDirectory=${this.paths.serverDir}

[Install]
WantedBy=default.target
`;
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

    const systemdDir = join(this.paths.homeDir, ".config/systemd/user");
    await mkdir(systemdDir, { recursive: true });

    const serviceContent = this.generateServiceFile(runtime);
    await writeFile(this.serviceFilePath, serviceContent, "utf-8");

    await execAsync("systemctl --user daemon-reload");
    await execAsync("systemctl --user enable tokengate-server");
    await execAsync("systemctl --user start tokengate-server");

    try {
      await execAsync("loginctl enable-linger $USER");
    } catch {
      console.warn(
        "Warning: Could not enable lingering. Service may not survive logout.\n" +
          "Run 'loginctl enable-linger' manually if needed."
      );
    }

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
      await execAsync("systemctl --user stop tokengate-server");
    } catch {}

    try {
      await execAsync("systemctl --user disable tokengate-server");
    } catch {}

    if (existsSync(this.serviceFilePath)) {
      await unlink(this.serviceFilePath);
    }

    await execAsync("systemctl --user daemon-reload");
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

    await execAsync("systemctl --user start tokengate-server");
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

    await execAsync("systemctl --user stop tokengate-server");
  }

  async status(): Promise<ServiceStatus> {
    const installed = existsSync(this.serviceFilePath);

    if (!installed) {
      return { installed: false, running: false };
    }

    let pid: number | undefined;
    let running = false;

    try {
      const { stdout } = await execAsync(
        "systemctl --user show tokengate-server --property=MainPID,ActiveState"
      );
      const lines = stdout.trim().split("\n");
      for (const line of lines) {
        const [key, value] = line.split("=");
        if (key === "MainPID" && value && value !== "0") {
          pid = parseInt(value, 10);
        }
        if (key === "ActiveState" && value === "active") {
          running = true;
        }
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
