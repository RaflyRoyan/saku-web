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
