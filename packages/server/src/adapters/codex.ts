import type { UsageAdapter, UsageData } from "./types.js";
import { runPackage } from "../utils/exec.js";
import { getTodayYYYYMMDD } from "../utils/date.js";

interface CodexResponse {
  daily?: Array<{
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }>;
  totals: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export const codexAdapter: UsageAdapter = {
  name: "codex",
  displayName: "Codex",

  async check(): Promise<boolean> {
    try {
      const result = await runPackage("@ccusage/codex", ["--help"], { timeout: 15000 });
      return result.stdout.length > 0 || result.stderr.length > 0;
    } catch {
      return false;
    }
  },

  async getUsage(): Promise<UsageData> {
    const today = getTodayYYYYMMDD();
    const result = await runPackage("@ccusage/codex", ["daily", "--json", "--since", today], {
      timeout: 30000,
    });

    if (result.exitCode !== 0) {
      throw new Error(`@ccusage/codex failed: ${result.stderr}`);
    }

    const data: CodexResponse = JSON.parse(result.stdout);
    
    const inputTokens = data.totals?.inputTokens ?? 0;
    const outputTokens = data.totals?.outputTokens ?? 0;

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    };
  },
};
