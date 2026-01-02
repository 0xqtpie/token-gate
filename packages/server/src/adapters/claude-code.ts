import type { UsageAdapter, UsageData } from "./types.js";
import { runPackage } from "../utils/exec.js";
import { getTodayYYYYMMDD } from "../utils/date.js";

interface CcusageResponse {
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

export const claudeCodeAdapter: UsageAdapter = {
  name: "claude-code",
  displayName: "Claude Code",

  async check(): Promise<boolean> {
    try {
      const result = await runPackage("ccusage", ["--help"], { timeout: 15000 });
      return result.stdout.length > 0 || result.stderr.length > 0;
    } catch {
      return false;
    }
  },

  async getUsage(): Promise<UsageData> {
    const today = getTodayYYYYMMDD();
    const result = await runPackage("ccusage", ["daily", "--json", "--since", today], {
      timeout: 30000,
    });

    if (result.exitCode !== 0) {
      throw new Error(`ccusage failed: ${result.stderr}`);
    }

    const data: CcusageResponse = JSON.parse(result.stdout);
    
    const inputTokens = data.totals?.inputTokens ?? 0;
    const outputTokens = data.totals?.outputTokens ?? 0;

    return {
      inputTokens,
      outputTokens,
      reasoningTokens: 0,
      totalTokens: inputTokens + outputTokens,
    };
  },
};
