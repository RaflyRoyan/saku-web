import { describe, it, expect } from "vitest";
import { app, createApp } from "../server/app";
import { storageError } from "../server/common/errors";
import { MemorySheetStore } from "../server/sheets/memory-store";
import { headerOf, SHEET_NAMES } from "../server/sheets/schema";

function storeWith(override: Partial<Record<string, string[] | null>>) {
  const grids: Record<string, string[][]> = {};
  for (const s of SHEET_NAMES) {
    const header = s in override ? override[s] : headerOf(s);
    if (header) grids[s] = [header];
  }
  return new MemorySheetStore(grids);
}

describe("health", () => {
  it("GET /api/health → ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok" });
  });

  it("endpoint tidak dikenal → 404 ProblemDetails", async () => {
    const res = await app.request("/api/tidak-ada");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
    expect(await res.json()).toMatchObject({ status: 404, title: "Endpoint tidak ditemukan." });
  });

  it("GET /api/health/sheets → 200 kalau semua header cocok", async () => {
    const store = new MemorySheetStore();
    const res = await createApp({ store: () => store }).request("/api/health/sheets");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.sheets).toHaveLength(SHEET_NAMES.length);
  });

  it("T17 · header sheet salah urutan → 503", async () => {
    const [a, b, ...rest] = headerOf("Akun");
    const store = storeWith({ Akun: [b, a, ...rest] });
    const res = await createApp({ store: () => store }).request("/api/health/sheets");
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    const akun = body.sheets.find((s: { nama: string }) => s.nama === "Akun");
    expect(akun.ok).toBe(false);
    expect(akun.masalah).toContain('Kolom A harus "id", tetapi "nama".');
    expect(body.sheets.find((s: { nama: string }) => s.nama === "Transaksi").ok).toBe(true);
  });

  it("sheet hilang atau kolom kurang → 503", async () => {
    const store = storeWith({ Tabungan: null, Pengguna: headerOf("Pengguna").slice(0, -1) });
    const res = await createApp({ store: () => store }).request("/api/health/sheets");
    expect(res.status).toBe(503);
    const body = await res.json();
    const byName = Object.fromEntries(body.sheets.map((s: { nama: string }) => [s.nama, s]));
    expect(byName.Tabungan.masalah).toEqual(["Sheet tidak ditemukan."]);
    expect(byName.Pengguna.masalah).toEqual(['Kolom N harus "updated_at", tetapi kosong.']);
  });

  it("Google gagal → 502 tanpa detail", async () => {
    class BrokenStore extends MemorySheetStore {
      override async readMany(): Promise<never> {
        throw storageError();
      }
    }
    const store = new BrokenStore();
    const res = await createApp({ store: () => store }).request("/api/health/sheets");
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ title: "Gagal mengakses penyimpanan data." });
  });
});
