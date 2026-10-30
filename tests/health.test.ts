import { describe, it, expect } from "vitest";
import { app } from "../server/app";

describe("health", () => {
  it("GET /api/health → ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok" });
  });
});
