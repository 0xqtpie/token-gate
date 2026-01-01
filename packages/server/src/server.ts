import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AggregatedUsage } from "./adapters/types.js";
import { aggregateUsage } from "./aggregator.js";
import { getAllAdapterNames } from "./adapters/index.js";
import { Cache } from "./cache.js";
import type { Config } from "./config.js";

const VERSION = "1.0.0";

export function createServer(config: Config) {
  const app = new Hono();
  const usageCache = new Cache<Omit<AggregatedUsage, "cached">>(config.cacheTtl);

  app.use("*", cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }));

  app.get("/health", (c) => {
    return c.json({
      status: "ok",
      version: VERSION,
      adapters: getAllAdapterNames(),
    });
  });

  app.get("/usage", async (c) => {
    const cached = usageCache.get();
    
    if (cached) {
      return c.json({
        ...cached,
        cached: true,
      });
    }

    const usage = await aggregateUsage(config.adapters);
    usageCache.set(usage);

    return c.json({
      ...usage,
      cached: false,
    });
  });

  return app;
}
