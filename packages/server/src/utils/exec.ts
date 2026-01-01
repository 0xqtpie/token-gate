import { spawn } from "node:child_process";

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ExecOptions {
  timeout?: number;
  cwd?: string;
}

export async function exec(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  const { timeout = 30000, cwd } = options;

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let killed = false;

    const proc = spawn(command, args, {
      cwd,
      shell: true,
    });

    const timeoutId = setTimeout(() => {
      killed = true;
      proc.kill();
      reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
    }, timeout);

    proc.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      clearTimeout(timeoutId);
      if (!killed) {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
        });
      }
    });

    proc.on("error", (error) => {
      clearTimeout(timeoutId);
      if (!killed) {
        reject(error);
      }
    });
  });
}

export async function commandExists(command: string): Promise<boolean> {
  try {
    const result = await exec("which", [command]);
    return result.exitCode === 0 && result.stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function bunxPackageExists(packageName: string): Promise<boolean> {
  try {
    const result = await exec("bunx", [packageName, "--help"], { timeout: 15000 });
    return result.exitCode === 0 || result.stdout.length > 0 || result.stderr.length > 0;
  } catch {
    return false;
  }
}
