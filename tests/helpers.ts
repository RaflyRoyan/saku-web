import { createApp } from "../server/app";
import { FakeClock } from "../server/common/clock";
import { MemorySheetStore } from "../server/sheets/memory-store";

/** App + memory store + clock palsu, dengan client yang menyimpan cookie seperti browser. */
export function setupTest(start = "2026-10-30T03:00:00Z") {
  const store = new MemorySheetStore();
  const clock = new FakeClock(start);
  const app = createApp({
    store: () => store,
    clock,
    // Iterasi kecil supaya test cepat; format hash tetap sama
    settings: () => ({ jwtSecret: "rahasia-test-minimal-32-karakter-xxxx", jwtExpireDays: 30, passwordIterations: 1000 }),
  });

  function client() {
    let cookie = "";
    async function request(method: string, path: string, body?: unknown, opts: { csrf?: boolean } = {}) {
      const headers: Record<string, string> = {};
      if (cookie) headers.Cookie = cookie;
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (opts.csrf !== false) headers["X-Requested-With"] = "saku";
      const res = await app.request(`/api${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
      });
      const set = res.headers.get("set-cookie");
      if (set) {
        const value = /saku_token=([^;]*)/.exec(set)?.[1] ?? "";
        cookie = value ? `saku_token=${value}` : "";
      }
      const text = await res.text();
      return { status: res.status, body: text ? JSON.parse(text) : undefined, setCookie: set };
    }
    return {
      get: (path: string) => request("GET", path),
      post: (path: string, body?: unknown, opts?: { csrf?: boolean }) => request("POST", path, body ?? {}, opts),
      put: (path: string, body?: unknown) => request("PUT", path, body ?? {}),
      del: (path: string) => request("DELETE", path),
      get cookie() {
        return cookie;
      },
      set cookie(v: string) {
        cookie = v;
      },
    };
  }

  return { app, store, clock, client };
}

export const ADMIN = { username: "admin", password: "rahasia123", nama: "Admin Saku" };

export const BUDI = { username: "budi", password: "budi12345", nama: "Budi", peran: "user" };

/** Admin + Budi, 4 akun, kategori Makan & Gaji. Clock: 30 Okt 2026 10.00 WIB. */
export async function siapkan() {
  const t = setupTest();
  const admin = t.client();
  await admin.post("/auth/setup", ADMIN);
  await admin.post("/pengguna", BUDI);
  const budi = t.client();
  await budi.post("/auth/login", { username: "budi", password: BUDI.password });

  const akun: Record<string, string> = {};
  for (const [nama, jenis] of [["BCA", "bank"], ["Mandiri", "bank"], ["Jago", "bank"], ["GoPay", "ewallet"]]) {
    akun[nama] = (await admin.post("/akun", { nama, jenis })).body.id;
  }
  const makan = (await admin.post("/kategori", { nama: "Makan", tipe: "keluar" })).body.id as string;
  const gaji = (await admin.post("/kategori", { nama: "Gaji", tipe: "masuk" })).body.id as string;
  const kategori = (await admin.get("/kategori")).body as { id: string; kodeSistem: string | null }[];
  const biayaAdmin = kategori.find((k) => k.kodeSistem === "BIAYA_ADMIN")!.id;
  const tarik = kategori.find((k) => k.kodeSistem === "TARIK_TABUNGAN")!.id;
  return { ...t, admin, budi, akun, makan, gaji, biayaAdmin, tarik };
}

