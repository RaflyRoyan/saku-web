import { Hono } from "hono";
import { DEFAULT_ITERATIONS } from "./auth/password";
import { csrf } from "./auth/session";
import type { Claims } from "./auth/token";
import { systemClock, type Clock } from "./common/clock";
import { problem, problemFromError } from "./common/errors";
import { getConfig, getStore } from "./config";
import { akun } from "./routes/akun";
import { auth } from "./routes/auth";
import { health } from "./routes/health";
import { kategori } from "./routes/kategori";
import { pengguna } from "./routes/pengguna";
import type { SheetStore } from "./sheets/store";

export interface Settings {
  jwtSecret: string;
  jwtExpireDays: number;
  passwordIterations: number;
}

export interface AppDeps {
  /** Lazy supaya `/api/health` tidak butuh env/Google. */
  store: () => SheetStore;
  clock: Clock;
  settings: () => Settings;
}

export type AppEnv = { Variables: AppDeps & { claims?: Claims } };

const envSettings = (): Settings => {
  const config = getConfig();
  return { jwtSecret: config.JWT_SECRET, jwtExpireDays: config.JWT_EXPIRE_DAYS, passwordIterations: DEFAULT_ITERATIONS };
};

/** Test memakai `createApp({ store: () => new MemorySheetStore(), clock: new FakeClock(...), settings })`. */
export function createApp(deps: Partial<AppDeps> = {}) {
  const resolved: AppDeps = {
    store: deps.store ?? getStore,
    clock: deps.clock ?? systemClock,
    settings: deps.settings ?? envSettings,
  };
  const app = new Hono<AppEnv>().basePath("/api");

  app.use(async (c, next) => {
    c.set("store", resolved.store);
    c.set("clock", resolved.clock);
    c.set("settings", resolved.settings);
    await next();
  });
  app.use(csrf);

  app.route("/health", health);
  app.route("/auth", auth);
  app.route("/pengguna", pengguna);
  app.route("/akun", akun);
  app.route("/kategori", kategori);

  app.notFound((c) => problem(c, 404, "Endpoint tidak ditemukan."));
  app.onError((err, c) => problemFromError(c, err));

  return app;
}

export const app = createApp();
