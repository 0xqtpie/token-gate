/**
 * Type definitions for usage adapters
 */

/**
 * Raw usage data from a single adapter
 */
export interface UsageData {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number; // inputTokens + outputTokens
}

/**
 * Interface that all adapters must implement
 */
export interface UsageAdapter {
  /** Unique identifier for this adapter (e.g., "claude-code") */
  name: string;
  
  /** Human-readable name (e.g., "Claude Code") */
  displayName: string;
  
  /** Check if this tool is installed and available */
  check(): Promise<boolean>;
  
  /** Get today's token usage */
  getUsage(): Promise<UsageData>;
}

/**
 * Result from a single adapter, including availability status
 */
export interface AdapterResult {
  source: string;
  displayName: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  available: boolean;
  error?: string;
}

/**
 * Aggregated usage response from all adapters
 */
export interface AggregatedUsage {
  total: UsageData;
  breakdown: AdapterResult[];
  timestamp: string;
  periodStart: string;
  periodEnd: string;
  cached: boolean;
}
