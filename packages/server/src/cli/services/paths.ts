import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";
import { mkdir, cp, rm } from "node:fs/promises";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { ServicePaths } from "./types.js";

export function findRuntime(): string {
  const tryCommand = (cmd: string): string | null => {
    try {
      return execSync(`which ${cmd}`, { encoding: "utf-8" }).trim();
    } catch {
      return null;
    }
  };

  const bun = tryCommand("bun");
  if (bun) return bun;

  const node = tryCommand("node");
  if (node) return node;

  throw new Error("Neither bun nor node found in PATH. Please install one of them.");
}

export function findRuntimeWindows(): string {
  const tryCommand = (cmd: string): string | null => {
    try {
      const result = execSync(`where ${cmd}`, { encoding: "utf-8" }).trim();
      return result.split("\n")[0] || null;
    } catch {
      return null;
    }
  };

  const bun = tryCommand("bun");
  if (bun) return bun;

  const node = tryCommand("node");
  if (node) return node;

  throw new Error("Neither bun nor node found in PATH. Please install one of them.");
}

export function getServicePaths(): ServicePaths {
  const home = homedir();
  const tokengateDir = join(home, ".tokengate");
  const logsDir = join(tokengateDir, "logs");
  const serverDir = join(tokengateDir, "server");

  return {
    homeDir: home,
    tokengateDir,
    logsDir,
    serverDir,
    runtime: "",
    serverEntry: join(serverDir, "index.js"),
  };
}

export async function ensureDirectories(paths: ServicePaths): Promise<void> {
  await mkdir(paths.logsDir, { recursive: true });
  await mkdir(paths.serverDir, { recursive: true });
}

export async function copyServerFiles(paths: ServicePaths): Promise<void> {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFile);
  const srcCliDir = dirname(currentDir);
  const srcDir = dirname(srcCliDir);
  const packageDir = dirname(srcDir);
  const distDir = join(packageDir, "dist");

  if (!existsSync(distDir)) {
    throw new Error(
      "Server distribution not found. The package may not be built correctly.\n" +
        "If you're developing locally, run 'bun run build' first."
    );
  }

  await rm(paths.serverDir, { recursive: true, force: true });
  await mkdir(paths.serverDir, { recursive: true });
  await cp(distDir, paths.serverDir, { recursive: true });
}

export async function cleanupServerFiles(paths: ServicePaths): Promise<void> {
  await rm(paths.serverDir, { recursive: true, force: true });
}

export async function isPortResponding(port: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`http://localhost:${port}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
