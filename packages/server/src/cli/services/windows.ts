import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeFile, unlink, mkdir } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { ServiceManager, ServiceStatus, ServicePaths } from "./types.js";
import { SERVICE_LABEL, DEFAULT_PORT } from "./types.js";
import {
  getServicePaths,
  ensureDirectories,
  copyServerFiles,
  cleanupServerFiles,
  findRuntimeWindows,
  isPortResponding,
} from "./paths.js";

const execAsync = promisify(exec);

export class WindowsServiceManager implements ServiceManager {
  private paths: ServicePaths;
  private vbsPath: string;

  constructor() {
    this.paths = getServicePaths();
    this.vbsPath = join(this.paths.tokengateDir, "start.vbs");
  }

  private generateVbsScript(runtime: string): string {
    const cmd = `${runtime} "${this.paths.serverEntry}"`;
    return `Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c ${cmd.replace(/"/g, '""')}", 0, False
`;
  }

  private escapeForPowerShell(str: string): string {
    return str.replace(/'/g, "''");
  }

  async install(): Promise<void> {
    const status = await this.status();
    if (status.installed) {
      throw new Error(
        "TokenGate server is already installed.\n" +
          "Use 'tokengate-server status' to check if it's running."
      );
    }

    const runtime = findRuntimeWindows();
    await ensureDirectories(this.paths);
    await copyServerFiles(this.paths);

    await mkdir(this.paths.tokengateDir, { recursive: true });

    const vbsContent = this.generateVbsScript(runtime);
    await writeFile(this.vbsPath, vbsContent, "utf-8");

    const psScript = `
      $action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "'${this.escapeForPowerShell(this.vbsPath)}'"
      $trigger = New-ScheduledTaskTrigger -AtLogon
      $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
      $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
      Register-ScheduledTask -TaskName "${SERVICE_LABEL}" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
    `;

    await execAsync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`);
    await execAsync(
      `powershell -Command "Start-ScheduledTask -TaskName '${SERVICE_LABEL}'"`
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

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

    await this.stopProcess();

    try {
      await execAsync(
        `powershell -Command "Unregister-ScheduledTask -TaskName '${SERVICE_LABEL}' -Confirm:\\$false"`
      );
    } catch {}

    if (existsSync(this.vbsPath)) {
      await unlink(this.vbsPath);
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

    await execAsync(
      `powershell -Command "Start-ScheduledTask -TaskName '${SERVICE_LABEL}'"`
    );
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

    await this.stopProcess();
  }

  private async stopProcess(): Promise<void> {
    try {
      const { stdout } = await execAsync(
        `powershell -Command "(Get-NetTCPConnection -LocalPort ${DEFAULT_PORT} -ErrorAction SilentlyContinue).OwningProcess"`
      );
      const pid = stdout.trim();
      if (pid && pid !== "0") {
        await execAsync(`taskkill /PID ${pid} /F`);
      }
    } catch {}
  }

  async status(): Promise<ServiceStatus> {
    let installed = false;

    try {
      const { stdout } = await execAsync(
        `powershell -Command "Get-ScheduledTask -TaskName '${SERVICE_LABEL}' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty State"`
      );
      installed = stdout.trim().length > 0;
    } catch {}

    if (!installed) {
      return { installed: false, running: false };
    }

    let pid: number | undefined;
    let running = false;

    try {
      const { stdout } = await execAsync(
        `powershell -Command "(Get-NetTCPConnection -LocalPort ${DEFAULT_PORT} -ErrorAction SilentlyContinue).OwningProcess"`
      );
      const pidStr = stdout.trim();
      if (pidStr && pidStr !== "0") {
        pid = parseInt(pidStr, 10);
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
