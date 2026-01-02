import { existsSync, statSync } from "node:fs";
import { rename, unlink } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024;

function getLogPaths(): { stdout: string; stderr: string } {
  const logsDir = join(homedir(), ".tokengate", "logs");
  return {
    stdout: join(logsDir, "stdout.log"),
    stderr: join(logsDir, "stderr.log"),
  };
}

async function rotateFile(filePath: string): Promise<void> {
  if (!existsSync(filePath)) return;

  try {
    const stats = statSync(filePath);
    if (stats.size < MAX_LOG_SIZE_BYTES) return;

    const backupPath = `${filePath}.old`;

    if (existsSync(backupPath)) {
      await unlink(backupPath);
    }

    await rename(filePath, backupPath);
  } catch {
  }
}

export async function rotateLogs(): Promise<void> {
  const { stdout, stderr } = getLogPaths();
  await Promise.all([rotateFile(stdout), rotateFile(stderr)]);
}
