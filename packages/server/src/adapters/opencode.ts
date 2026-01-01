import type { UsageAdapter, UsageData } from "./types.js";
import { exec, commandExists } from "../utils/exec.js";

function parseTokenValue(value: string): number {
  const cleaned = value.trim().replace(/,/g, "");
  const match = cleaned.match(/^([\d.]+)([KMB])?$/i);
  
  if (!match) return 0;
  
  const num = parseFloat(match[1] ?? "0");
  const suffix = (match[2] ?? "").toUpperCase();
  
  const multipliers: Record<string, number> = {
    "K": 1_000,
    "M": 1_000_000,
    "B": 1_000_000_000,
    "": 1,
  };
  
  return Math.round(num * (multipliers[suffix] ?? 1));
}

function extractTokensFromOutput(output: string): { input: number; output: number } {
  const lines = output.split("\n");
  let input = 0;
  let outputTokens = 0;

  for (const line of lines) {
    const inputMatch = line.match(/│\s*Input\s+([^\s│]+)/i);
    if (inputMatch?.[1]) {
      input = parseTokenValue(inputMatch[1]);
    }

    const outputMatch = line.match(/│\s*Output\s+([^\s│]+)/i);
    if (outputMatch?.[1]) {
      outputTokens = parseTokenValue(outputMatch[1]);
    }
  }

  return { input, output: outputTokens };
}

export const opencodeAdapter: UsageAdapter = {
  name: "opencode",
  displayName: "OpenCode",

  async check(): Promise<boolean> {
    return commandExists("opencode");
  },

  async getUsage(): Promise<UsageData> {
    const result = await exec("opencode", ["stats", "--days", "1"], {
      timeout: 30000,
    });

    if (result.exitCode !== 0) {
      throw new Error(`opencode stats failed: ${result.stderr}`);
    }

    const { input, output } = extractTokensFromOutput(result.stdout);

    return {
      inputTokens: input,
      outputTokens: output,
      totalTokens: input + output,
    };
  },
};
