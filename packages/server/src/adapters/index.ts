import type { UsageAdapter } from "./types.js";
import { claudeCodeAdapter } from "./claude-code.js";
import { codexAdapter } from "./codex.js";
import { opencodeAdapter } from "./opencode.js";

export type { UsageAdapter, UsageData, AdapterResult, AggregatedUsage } from "./types.js";

const allAdapters: UsageAdapter[] = [
  claudeCodeAdapter,
  opencodeAdapter,
  codexAdapter,
];

export function getAdapters(filter: string[] | "all" = "all"): UsageAdapter[] {
  if (filter === "all") {
    return allAdapters;
  }
  return allAdapters.filter((adapter) => filter.includes(adapter.name));
}

export function getAdapterByName(name: string): UsageAdapter | undefined {
  return allAdapters.find((adapter) => adapter.name === name);
}

export function getAllAdapterNames(): string[] {
  return allAdapters.map((adapter) => adapter.name);
}
