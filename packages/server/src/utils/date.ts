/**
 * Date utilities for token period calculations
 */

/**
 * Get today's date in YYYYMMDD format (for ccusage --since flag)
 */
export function getTodayYYYYMMDD(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Get the start of today (midnight local time) as ISO string
 */
export function getPeriodStart(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return start.toISOString();
}

/**
 * Get the end of today (midnight tomorrow local time) as ISO string
 */
export function getPeriodEnd(): string {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return end.toISOString();
}

/**
 * Get current timestamp as ISO string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
