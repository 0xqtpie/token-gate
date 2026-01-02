import type { UsageAdapter, UsageData } from "./types.js";
import { runPackage } from "../utils/exec.js";
import { getTodayYYYYMMDD } from "../utils/date.js";

interface CodexResponse {
  daily?: Array<{
    inputTokens: number;
    cachedInputTokens?: number;
    outputTokens: number;
    reasoningOutputTokens?: number;
    totalTokens: number;
  }>;
  totals: {
    inputTokens: number;
    cachedInputTokens?: number;
    outputTokens: number;
    reasoningOutputTokens?: number;
    totalTokens: number;
  };
}

export const codexAdapter: UsageAdapter = {
  name: "codex",
  displayName: "Codex",

  async check(): Promise<boolean> {
    try {
      const result = await runPackage("@ccusage/codex", ["--help"], {
        timeout: 15000,
      });
      return result.stdout.length > 0 || result.stderr.length > 0;
    } catch {
      return false;
    }
  },

  async getUsage(): Promise<UsageData> {
    const today = getTodayYYYYMMDD();
    const result = await runPackage(
      "@ccusage/codex@latest",
      ["daily", "--json", "--since", today],
      {
        timeout: 30000,
      }
    );

    if (result.exitCode !== 0) {
      throw new Error(`@ccusage/codex failed: ${result.stderr}`);
    }

    const data: CodexResponse = JSON.parse(result.stdout);

    const rawInput = data.totals?.inputTokens ?? 0;
    const cachedInput = data.totals?.cachedInputTokens ?? 0;
    const inputTokens = rawInput - cachedInput;
    const outputTokens = data.totals?.outputTokens ?? 0;
    const reasoningTokens = data.totals?.reasoningOutputTokens ?? 0;

    return {
      inputTokens,
      outputTokens,
      reasoningTokens,
      totalTokens: inputTokens + outputTokens + reasoningTokens,
    };
  },
};
