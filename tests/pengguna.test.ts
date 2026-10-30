import { describe, it, expect } from "vitest";
import { ADMIN, setupTest } from "./helpers";

async function withAdmin() {
  const t = setupTest();
  const admin = t.client();
  const setup = await admin.post("/auth/setup", ADMIN);
  return { ...t, admin, adminId: setup.body.pengguna.id as string };
}

const BUDI = { username: "budi", password: "budi12345", nama: "Budi", peran: "user" };

describe("kelola pengguna (admin)", () => {
  it("tambah, daftar, login sebagai pengguna baru", async () => {
    const { admin, client } = await withAdmin();
    const created = await admin.post("/pengguna", BUDI);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ username: "budi", peran: "user", aktif: true });

    const list = await admin.get("/pengguna");
    expect(list.body.map((p: { username: string }) => p.username)).toEqual(["admin", "budi"]);
    expect(JSON.stringify(list.body)).not.toContain("pbkdf2");

    expect((await client().post("/auth/login", { username: "budi", password: BUDI.password })).status).toBe(200);
  });

  it("username dobel (case-insensitive) → 409", async () => {
    const { admin } = await withAdmin();
    await admin.post("/pengguna", BUDI);
    const res = await admin.post("/pengguna", { ...BUDI, username: "BUDI" });
    expect(res.status).toBe(409);
  });

  it("bukan admin → 403", async () => {
    const { admin, client } = await withAdmin();
    await admin.post("/pengguna", BUDI);
    const budi = client();
    await budi.post("/auth/login", { username: "budi", password: BUDI.password });
    expect((await budi.get("/pengguna")).status).toBe(403);
    expect((await budi.post("/pengguna", { ...BUDI, username: "cici" })).status).toBe(403);
  });

  it("admin tidak bisa menonaktifkan diri sendiri; minimal 1 admin aktif", async () => {
    const { admin, adminId } = await withAdmin();
    const self = await admin.put(`/pengguna/${adminId}`, { nama: "Admin", peran: "admin", aktif: false });
    expect(self.status).toBe(409);
    expect(self.body.title).toBe("Anda tidak bisa menonaktifkan akun sendiri.");

    const demote = await admin.put(`/pengguna/${adminId}`, { nama: "Admin", peran: "user", aktif: true });
    expect(demote.status).toBe(409);
    expect(demote.body.title).toBe("Harus ada minimal 1 admin aktif.");
  });

  it("menonaktifkan pengguna mengakhiri sesinya", async () => {
    const { admin, client } = await withAdmin();
    const { body: budiDto } = await admin.post("/pengguna", BUDI);
    const budi = client();
    await budi.post("/auth/login", { username: "budi", password: BUDI.password });
    expect((await budi.get("/auth/me")).status).toBe(200);

    const res = await admin.put(`/pengguna/${budiDto.id}`, { nama: "Budi", peran: "user", aktif: false });
    expect(res.status).toBe(200);
    expect((await budi.get("/auth/me")).status).toBe(401);
    expect((await client().post("/auth/login", { username: "budi", password: BUDI.password })).status).toBe(401);
  });

  it("reset password: sesi lama berakhir, password baru bisa dipakai", async () => {
    const { admin, client } = await withAdmin();
    const { body: budiDto } = await admin.post("/pengguna", BUDI);
    const budi = client();
    await budi.post("/auth/login", { username: "budi", password: BUDI.password });

    expect((await admin.post(`/pengguna/${budiDto.id}/reset-password`, { passwordBaru: "reset12345" })).status).toBe(204);
    expect((await budi.get("/auth/me")).status).toBe(401);
    expect((await client().post("/auth/login", { username: "budi", password: "reset12345" })).status).toBe(200);
  });

  it("ID tidak ada → 404", async () => {
    const { admin } = await withAdmin();
    expect((await admin.put("/pengguna/US-tidakada", { nama: "X", peran: "user", aktif: true })).status).toBe(404);
  });
});
