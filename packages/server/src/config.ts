/**
 * Server configuration
 * Loads from environment variables with sensible defaults
 */

export interface Config {
  port: number;
  cacheTtl: number;
  adapters: string[] | "all";
}

export function loadConfig(): Config {
  const port = parseInt(process.env.PORT || "3847", 10);
  const cacheTtl = parseInt(process.env.CACHE_TTL || "30", 10);
  
  const adaptersEnv = process.env.ADAPTERS;
  const adapters: string[] | "all" = adaptersEnv 
    ? adaptersEnv.split(",").map(s => s.trim()).filter(Boolean)
    : "all";

  return {
    port: isNaN(port) ? 3847 : port,
    cacheTtl: isNaN(cacheTtl) ? 30 : cacheTtl,
    adapters,
  };
}
