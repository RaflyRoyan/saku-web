import { Hono } from "hono";
import { systemClock, type Clock } from "./common/clock";
import { problem, problemFromError } from "./common/errors";
import { getStore } from "./config";
import { health } from "./routes/health";
import type { SheetStore } from "./sheets/store";

export interface AppDeps {
  /** Lazy supaya `/api/health` tidak butuh env/Google. */
  store: () => SheetStore;
  clock: Clock;
}

export type AppEnv = { Variables: AppDeps };

/** Test memakai `createApp({ store: () => new MemorySheetStore(), clock: new FakeClock(...) })`. */
export function createApp(deps: Partial<AppDeps> = {}) {
  const resolved: AppDeps = { store: deps.store ?? getStore, clock: deps.clock ?? systemClock };
  const app = new Hono<AppEnv>().basePath("/api");

  app.use(async (c, next) => {
    c.set("store", resolved.store);
    c.set("clock", resolved.clock);
    await next();
  });

  app.route("/health", health);

  app.notFound((c) => problem(c, 404, "Endpoint tidak ditemukan."));
  app.onError((err, c) => problemFromError(c, err));

  return app;
}

export const app = createApp();
