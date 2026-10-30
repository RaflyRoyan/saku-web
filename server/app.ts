import { Hono } from "hono";

export const app = new Hono().basePath("/api");

app.get("/health", (c) =>
  c.json({ status: "ok", waktu: new Date().toISOString() })
);

app.notFound((c) =>
  c.json({ title: "Endpoint tidak ditemukan.", status: 404 }, 404)
);
