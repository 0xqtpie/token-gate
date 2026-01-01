import type { AdapterResult, AggregatedUsage, UsageAdapter } from "./adapters/types.js";
import { getAdapters } from "./adapters/index.js";
import { getCurrentTimestamp, getPeriodStart, getPeriodEnd } from "./utils/date.js";

export async function aggregateUsage(
  adapterFilter: string[] | "all" = "all"
): Promise<Omit<AggregatedUsage, "cached">> {
  const adapters = getAdapters(adapterFilter);
  
  const results = await Promise.all(
    adapters.map(async (adapter): Promise<AdapterResult> => {
      try {
        const available = await adapter.check();
        
        if (!available) {
          return {
            source: adapter.name,
            displayName: adapter.displayName,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            available: false,
            error: `${adapter.displayName} not installed`,
          };
        }

        const usage = await adapter.getUsage();
        
        return {
          source: adapter.name,
          displayName: adapter.displayName,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
          available: true,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return {
          source: adapter.name,
          displayName: adapter.displayName,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          available: false,
          error: message,
        };
      }
    })
  );

  const total = results.reduce(
    (acc, result) => ({
      inputTokens: acc.inputTokens + result.inputTokens,
      outputTokens: acc.outputTokens + result.outputTokens,
      totalTokens: acc.totalTokens + result.totalTokens,
    }),
    { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
  );

  return {
    total,
    breakdown: results,
    timestamp: getCurrentTimestamp(),
    periodStart: getPeriodStart(),
    periodEnd: getPeriodEnd(),
  };
}
