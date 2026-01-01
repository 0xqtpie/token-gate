/**
 * Simple TTL cache for usage data
 * Prevents hammering CLI tools on every request
 */

export class Cache<T> {
  private data: T | null = null;
  private timestamp: number = 0;
  private readonly ttlMs: number;

  constructor(ttlSeconds: number = 30) {
    this.ttlMs = ttlSeconds * 1000;
  }

  /**
   * Get cached data if still valid
   */
  get(): T | null {
    if (this.isValid()) {
      return this.data;
    }
    return null;
  }

  /**
   * Store data in cache
   */
  set(data: T): void {
    this.data = data;
    this.timestamp = Date.now();
  }

  /**
   * Check if cache is still valid
   */
  isValid(): boolean {
    if (this.data === null) return false;
    return Date.now() - this.timestamp < this.ttlMs;
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.data = null;
    this.timestamp = 0;
  }

  /**
   * Get age of cache in seconds
   */
  getAge(): number {
    if (this.timestamp === 0) return Infinity;
    return Math.floor((Date.now() - this.timestamp) / 1000);
  }
}
