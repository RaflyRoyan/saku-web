# Saku · 01 · Setup & Struktur Proyek

> **Untuk Claude Code.** Dokumen ini **hanya** untuk menyiapkan proyek: install, struktur folder, file konfigurasi, dan kerangka kosong.
> **Jangan** menulis logika bisnis di tahap ini. Fitur dan tampilan ada di [`02-pekerjaan-dan-tampilan.md`](02-pekerjaan-dan-tampilan.md).
> Kalau ada yang ambigu, **tanyakan ke user dulu**.

```
HP & laptop (PWA, React SPA) ──fetch /api/* + cookie──▶ Netlify Function (Hono, TypeScript) ──Service Account──▶ Google Sheets
```

---

## 1. Stack

| Bagian | Pilihan |
|---|---|
| Frontend | Vite + React + TypeScript, React Router |
| UI | Tailwind CSS v4, tema warna **Sunrise**, font **Manrope** (`@fontsource-variable/manrope`) |
| Ikon | `lucide-react` |
| Data fetching | TanStack Query |
| Grafik | Chart.js + `react-chartjs-2` |
| API | 1 Netlify Function + Hono, semua endpoint di `/api/*` |
| Validasi | `zod` + `@hono/zod-validator` |
| Google Sheets | `@googleapis/sheets` |
| PWA | `vite-plugin-pwa` |
| Test | Vitest |
| Dev lokal | `netlify dev` |

Lingkungan user: **Windows**, proyek di `D:\code`, **Node v22** (jangan minta upgrade Node global).

---

## 2. Langkah setup

### 2.1 Buat proyek & install

```powershell
cd D:\code
npm create vite@latest saku -- --template react-ts
cd saku
npm install

# Frontend
npm i react-router-dom @tanstack/react-query chart.js react-chartjs-2 lucide-react @fontsource-variable/manrope
npm i -D tailwindcss @tailwindcss/vite vite-plugin-pwa @vite-pwa/assets-generator

# API
npm i hono zod @hono/zod-validator @googleapis/sheets
npm i -D @netlify/functions netlify-cli vitest @types/node

git init
git checkout -b main
```

`netlify-cli` dipasang **lokal di proyek**, dijalankan dengan `npx netlify ...`.

### 2.2 Struktur folder

Buat struktur berikut. File bertanda `(kosong)` cukup berisi export minimal atau komentar `// TODO` supaya build tetap lulus.

```
saku/
├─ CLAUDE.md                      # aturan proyek untuk Claude Code (§3.10)
├─ docs/
│  ├─ SAKU_API_SPEC.md            # spesifikasi bisnis & endpoint (disalin user)
│  ├─ 01-setup-proyek.md          # dokumen ini
│  └─ 02-pekerjaan-dan-tampilan.md
├─ src/                           # FRONTEND
│  ├─ main.tsx                    # Router + QueryClient + font + css
│  ├─ index.css                   # Tailwind + token warna
│  ├─ App.tsx                     # definisi route
│  ├─ lib/
│  │  ├─ api.ts                   # fetch wrapper
│  │  └─ format.ts                # formatRupiah, formatTanggal (kosong)
│  ├─ hooks/                      # (kosong)
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ AppLayout.tsx         # bottom nav (HP) / sidebar (laptop)
│  │  │  └─ AuthLayout.tsx        # layout halaman login/setup
│  │  └─ ui/                      # Button, Card, Input, Sheet, dll. (kosong)
│  └─ pages/                      # 1 file placeholder per halaman (§3.7)
├─ server/                        # BACKEND (tidak ikut ke browser)
│  ├─ app.ts                      # Hono app
│  ├─ config.ts                   # baca & validasi env
│  ├─ sheets/
│  │  ├─ store.ts                 # interface SheetStore (kosong)
│  │  ├─ google-store.ts          # (kosong)
│  │  ├─ memory-store.ts          # (kosong)
│  │  ├─ schema.ts                # (kosong)
│  │  └─ parse.ts                 # (kosong)
│  ├─ auth/                       # (kosong)
│  ├─ repositories/               # (kosong)
│  ├─ services/                   # (kosong)
│  ├─ routes/                     # (kosong)
│  └─ common/
│     ├─ clock.ts                 # waktu WIB (kosong)
│     ├─ id.ts                    # generator ID (kosong)
│     └─ errors.ts                # ProblemDetails (kosong)
├─ netlify/functions/
│  └─ api.ts                      # entry point function
├─ tests/
│  └─ health.test.ts
├─ public/
│  └─ logo.svg                    # logo sementara
├─ template/                      # Saku_Template.xlsx + buat_template.py (disalin user)
├─ netlify.toml
├─ vite.config.ts
├─ vitest.config.ts
├─ tsconfig.server.json
├─ .env.example
├─ .env                           # JANGAN di-commit
└─ .gitignore
```

---

## 3. Isi file

### 3.1 `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  node_bundler = "esbuild"

[dev]
  command = "npm run dev"
  targetPort = 5173
  port = 8888

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3.2 `netlify/functions/api.ts`

```ts
import type { Config, Context } from "@netlify/functions";
import { app } from "../../server/app";

export default (req: Request, context: Context) => app.fetch(req, { context });

export const config: Config = {
  path: "/api/*",
};
```

### 3.3 `server/app.ts`

```ts
import { Hono } from "hono";

export const app = new Hono().basePath("/api");

app.get("/health", (c) =>
  c.json({ status: "ok", waktu: new Date().toISOString() })
);

app.notFound((c) =>
  c.json({ title: "Endpoint tidak ditemukan.", status: 404 }, 404)
);
```

### 3.4 `server/config.ts`

Baca dan validasi env dengan `zod`. Kalau `SHEETS_MODE=google`, maka `SPREADSHEET_ID`, `GOOGLE_CLIENT_EMAIL`, dan `GOOGLE_PRIVATE_KEY` wajib ada. `JWT_SECRET` wajib minimal 32 karakter. Ubah `\n` literal di private key menjadi newline. Pesan error berbahasa Indonesia.

### 3.5 `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Saku",
        short_name: "Saku",
        description: "Pencatatan keuangan pribadi",
        lang: "id",
        start_url: "/",
        display: "standalone",
        background_color: "#fffaf5",
        theme_color: "#c2410c",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//], // data API tidak pernah di-cache
      },
    }),
  ],
});
```

Generate ikon dari `public/logo.svg`:

```powershell
npx pwa-assets-generator --preset minimal-2023 public/logo.svg
```

Sesuaikan nama file ikon di manifest dengan hasil generator.

### 3.6 `src/index.css` (token warna tema Sunrise)

Import font di `src/main.tsx`: `import "@fontsource-variable/manrope";`

```css
@import "tailwindcss";

@theme {
  --font-sans: "Manrope Variable", ui-sans-serif, system-ui, sans-serif;

  /* Brand: oranye matahari terbit */
  --color-brand-50:  #fff7ed;
  --color-brand-100: #ffedd5;
  --color-brand-200: #fed7aa;
  --color-brand-400: #fb923c;
  --color-brand-500: #f97316;
  --color-brand-600: #ea580c; /* ikon & aksen saja, jangan untuk teks kecil */
  --color-brand-700: #c2410c; /* tombol utama, nav aktif, teks brand */
  --color-brand-800: #9a3412;

  /* Langit fajar: gradasi kartu utama */
  --color-fajar-ungu:   #7e22ce;
  --color-fajar-merah:  #be123c;
  --color-fajar-oranye: #ea580c;

  /* Netral hangat */
  --color-latar:      #fffaf5; /* background halaman (krem) */
  --color-latar-glow: #ffedd5; /* cahaya tipis di atas halaman */
  --color-garis:      #f3e3d3; /* border kartu & divider */

  /* Warna bermakna (teks/ikon di atas putih/krem, kontras ≥ 4.5:1) */
  --color-masuk:    #047857; /* hijau */
  --color-keluar:   #be123c; /* merah mawar */
  --color-transfer: #6d28d9; /* ungu fajar */
  --color-tabungan: #a16207; /* emas matahari */
}

html, body, #root { height: 100%; }
body {
  @apply bg-latar text-stone-900 antialiased;
  background-image: linear-gradient(to bottom, var(--color-latar-glow), transparent 240px);
  background-repeat: no-repeat;
}

/* Kartu utama (saldo) */
.bg-sunrise {
  background-image: linear-gradient(135deg, var(--color-fajar-ungu), var(--color-fajar-merah) 55%, var(--color-fajar-oranye));
}
```

### 3.7 Route & halaman placeholder

`src/App.tsx` mendefinisikan route berikut. Setiap halaman di `src/pages/` cukup menampilkan judulnya dulu.

| Route | File | Layout |
|---|---|---|
| `/setup` | `SetupPage.tsx` | AuthLayout |
| `/login` | `LoginPage.tsx` | AuthLayout |
| `/` | `DashboardPage.tsx` | AppLayout |
| `/transaksi/baru` | `TransaksiFormPage.tsx` | AppLayout |
| `/transaksi/:id` | `TransaksiFormPage.tsx` | AppLayout |
| `/akun` | `AkunPage.tsx` | AppLayout |
| `/akun/:id` | `AkunDetailPage.tsx` | AppLayout |
| `/riwayat` | `RiwayatPage.tsx` | AppLayout |
| `/periode/baru` | `PeriodeBaruPage.tsx` | AppLayout |
| `/langganan` | `LanggananPage.tsx` | AppLayout |
| `/tabungan` | `TabunganPage.tsx` | AppLayout |
| `/master` | `MasterPage.tsx` | AppLayout |
| `/lainnya` | `LainnyaPage.tsx` | AppLayout |
| `/pengaturan` | `PengaturanPage.tsx` | AppLayout |
| `/pengguna` | `PenggunaPage.tsx` | AppLayout |
| `*` | `NotFoundPage.tsx` | – |

`AppLayout` sudah berisi bottom nav (HP) dan sidebar (≥ `lg`) sesuai `02-pekerjaan-dan-tampilan.md` §5, tapi belum ada proteksi login.

### 3.8 `src/lib/api.ts`

```ts
export class ApiError extends Error {
  constructor(public status: number, public title: string, public errors?: Record<string, string[]>) {
    super(title);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "saku",
      ...init.headers,
    },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.title ?? "Terjadi kesalahan.", body.errors);
  return body as T;
}
```

### 3.9 Konfigurasi lain

**`tsconfig.server.json`**: compile check untuk `server/`, `netlify/`, dan `tests/` (`lib: ["ES2023", "DOM"]`, `types: ["node"]`, `noEmit: true`, `strict: true`). Daftarkan di `references` pada `tsconfig.json` root, sehingga `tsc -b` ikut mengecek backend.

**`vitest.config.ts`**:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

**`tests/health.test.ts`**:

```ts
import { describe, it, expect } from "vitest";
import { app } from "../server/app";

describe("health", () => {
  it("GET /api/health → ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok" });
  });
});
```

**`package.json` scripts**:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "netlify": "netlify dev",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

**`.env.example`** (juga disalin menjadi `.env`):

```env
SHEETS_MODE=memory
SPREADSHEET_ID=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
JWT_SECRET=ganti-dengan-minimal-32-karakter-acak-xxxxxx
JWT_EXPIRE_DAYS=30
```

**`.gitignore`** (tambahkan):

```
.env
.netlify
service-account*.json
*.key.json
```

### 3.10 `CLAUDE.md`

```md
# Saku

Aplikasi pencatatan keuangan pribadi multi-pengguna. Web + PWA, di-host di Netlify.

## Dokumen
- docs/SAKU_API_SPEC.md: model data Google Sheets, aturan bisnis, endpoint, skenario uji (sumber kebenaran)
- docs/02-pekerjaan-dan-tampilan.md: daftar pekerjaan per milestone, penyesuaian stack, desain tampilan
- Kalau spec menyebut .NET/Render/Bearer token, ikuti penyesuaian di 02 §2

## Perintah
- npx netlify dev   → http://localhost:8888 (frontend + API)
- npm test          → Vitest
- npm run build     → wajib lulus sebelum commit

## Aturan
- TypeScript strict. Frontend di src/, backend di server/, entry function di netlify/functions/api.ts
- Kode browser tidak boleh import dari server/
- Pesan error & teks UI: Bahasa Indonesia
- Jangan commit .env atau kredensial apa pun
- Jangan log password, token, atau private key
- Kerjakan per milestone. Setelah selesai: npm run build && npm test, lalu laporkan
- Kalau ambigu, tanya user dulu
```

---

## 4. Verifikasi (definisi selesai)

- [ ] `npx netlify dev` jalan, `http://localhost:8888` menampilkan Dashboard placeholder dengan bottom nav
- [ ] `http://localhost:8888/api/health` mengembalikan **JSON** `{ "status": "ok" }`, bukan HTML
- [ ] `http://localhost:8888/api/xyz` mengembalikan JSON 404
- [ ] Semua route di §3.7 bisa dibuka (placeholder)
- [ ] `npm run build` lulus (termasuk type check `server/`)
- [ ] `npm test` lulus
- [ ] `dist/` berisi `manifest.webmanifest` dan `sw.js`
- [ ] Commit pertama: `chore: scaffold proyek Saku`

---

## 5. Deploy pertama ke Netlify (dikerjakan user)

1. Push ke GitHub (repo private boleh). Pastikan `.env` tidak ikut.
2. Netlify → **Add new project → Import an existing project → GitHub** → repo `saku`. Build settings terbaca dari `netlify.toml`.
3. **Environment variables** (scope Functions): `SHEETS_MODE=memory` dan `JWT_SECRET` dulu. Kredensial Google ditambahkan di M1.
4. Ganti nama project, mis. `saku-ryn` → `https://saku-ryn.netlify.app`.
5. Cek `https://saku-ryn.netlify.app/api/health`.
6. **Build & deploy → Branches and deploy contexts**: production branch `main`, branch deploys **None**, deploy previews **off**.

> **Hemat kredit:** free plan 300 kredit/bulan, setiap production deploy 15 kredit. Kerjakan di branch `dev`, tes dengan `netlify dev`, lalu merge ke `main` hanya saat satu milestone selesai.

---

## 6. Prompt untuk Claude Code

```
Baca docs/01-setup-proyek.md. Kerjakan seluruh setup di dokumen itu:
install package, buat struktur folder, isi file konfigurasi, halaman
placeholder, dan CLAUDE.md. Jangan menulis logika bisnis. Setelah selesai,
jalankan npm run build dan npm test, lalu laporkan hasil checklist §4.
```
