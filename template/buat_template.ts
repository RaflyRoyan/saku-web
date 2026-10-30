// Membuat template/Saku_Template.xlsx dari server/sheets/schema.ts, jadi header selalu sama dengan API.
// Jalankan: npm run template

import ExcelJS from "exceljs";
import { fileURLToPath } from "node:url";
import { toWibIso } from "../server/common/clock.ts";
import { generateId } from "../server/common/id.ts";
import { columnLetter, ID_PREFIX, SCHEMA, SHEET_NAMES, type SheetName } from "../server/sheets/schema.ts";

const OUTPUT = fileURLToPath(new URL("./Saku_Template.xlsx", import.meta.url));
const MAX_ROW = 2000; // jangkauan validasi data

const AUDIT_NOTE = "Diisi otomatis oleh API. Jangan diisi manual.";

// Catatan (hover) per kolom. Kolom audit memakai AUDIT_NOTE.
const NOTES: Partial<Record<SheetName, Record<string, string>>> = {
  Pengguna: {
    id: "US-xxxxxxxx. Dibuat API saat Setup Awal / admin menambah pengguna.",
    username: "Unik, huruf kecil, 3–30 karakter [a-z0-9._].",
    password_hash: "pbkdf2-sha256$iterasi$salt$hash. Jangan diubah manual.",
    peran: "admin / user",
    versi_token: "Mulai 1. Naik saat ganti/reset password atau dinonaktifkan → semua sesi lama keluar.",
    gagal_login: "Jumlah gagal login berturut-turut (lockout).",
    terkunci_sampai: "Login ditolak sampai waktu ini (WIB).",
  },
  Akun: {
    id: "AK-xxxxxxxx. Master bersama semua pengguna, hanya admin yang mengubah.",
    nama: "1–40 karakter, unik di antara akun aktif.",
    jenis: "bank / ewallet / cash",
    aktif: "FALSE = nonaktif. Master tidak dihapus.",
  },
  Kategori: {
    id: "KT-xxxxxxxx. Master bersama semua pengguna, hanya admin yang mengubah.",
    nama: "1–40 karakter, unik per tipe di antara kategori aktif.",
    tipe: "masuk / keluar",
    kode_sistem: "Kosong, BIAYA_ADMIN (keluar), atau TARIK_TABUNGAN (masuk). Kategori sistem tidak bisa dinonaktifkan.",
  },
  Periode: {
    id: "PR-xxxxxxxx",
    tanggal_mulai: "yyyy-MM-dd",
    tanggal_selesai: "Kosong = periode aktif. Maksimal 1 aktif per pengguna.",
  },
  SaldoAwal: {
    id: "SA-xxxxxxxx",
    akun_id: "Unik per (periode_id, akun_id).",
    saldo: "Angka ≥ 0, tanpa titik.",
  },
  Transaksi: {
    id: "TR-xxxxxxxx",
    periode_id: "Ditentukan server dari tanggal.",
    tanggal: "yyyy-MM-dd",
    tipe: "keluar / masuk / transfer",
    akun_id: "Sumber (keluar/transfer) atau penerima (masuk).",
    akun_tujuan_id: "Wajib untuk transfer, kosong untuk lainnya.",
    kategori_id: "Wajib untuk keluar/masuk, kosong untuk transfer.",
    nominal: "Angka > 0, tanpa titik.",
    biaya_admin: "Hanya untuk transfer, selain itu 0.",
    deskripsi: "Maks 200 karakter.",
    berulang_id: "Diisi saat konfirmasi langganan.",
  },
  Berulang: {
    id: "RB-xxxxxxxx",
    kategori_id: "Kategori keluar yang aktif.",
    tgl_jatuh_tempo: "1–31. Bulan yang lebih pendek → hari terakhir bulan itu.",
    ingatkan_h_min: "0–15 hari sebelum jatuh tempo, default 3.",
    mulai: "yyyy-MM",
    selesai: "yyyy-MM. Kosong = tanpa batas.",
  },
  BerulangLewati: {
    id: "RL-xxxxxxxx",
    bulan: "yyyy-MM. Unik per (berulang_id, bulan).",
  },
  Tabungan: {
    id: "TB-xxxxxxxx",
    tanggal: "Setor = tanggal_selesai periode asal; tarik = input.",
    jenis: "setor / tarik",
    nominal: "Setor boleh minus/0; tarik > 0.",
    transaksi_id: "Tarik: ID transaksi masuk TARIK_TABUNGAN yang dibuat otomatis.",
  },
};

const ENUMS: Partial<Record<SheetName, Record<string, string[]>>> = {
  Pengguna: { peran: ["admin", "user"] },
  Akun: { jenis: ["bank", "ewallet", "cash"] },
  Kategori: { tipe: ["masuk", "keluar"], kode_sistem: ["BIAYA_ADMIN", "TARIK_TABUNGAN"] },
  Transaksi: { tipe: ["keluar", "masuk", "transfer"] },
  Tabungan: { jenis: ["setor", "tarik"] },
};

// [nama, jenis] — dari template lama, boleh diganti nama di sheet
const AKUN_AWAL: [string, "bank" | "ewallet" | "cash"][] = [
  ["Bank Jawa Timur", "bank"],
  ["Bank Negara Indonesia", "bank"],
  ["Blu Digital", "bank"],
  ["GoPay", "ewallet"],
  ["Cash", "cash"],
];

// [nama, tipe, kode_sistem]
const KATEGORI_AWAL: [string, "masuk" | "keluar", string][] = [
  ["Bonus", "masuk", ""],
  ["Freelance", "masuk", ""],
  ["Refund", "masuk", ""],
  ["Pemberian", "masuk", ""],
  ["Bunga Bank", "masuk", ""],
  ["Lainnya", "masuk", ""],
  ["Tarik Tabungan", "masuk", "TARIK_TABUNGAN"],
  ["Makan & Minum", "keluar", ""],
  ["Transportasi", "keluar", ""],
  ["Belanja", "keluar", ""],
  ["Tagihan", "keluar", ""],
  ["Pulsa & Internet", "keluar", ""],
  ["Langganan", "keluar", ""],
  ["Hiburan", "keluar", ""],
  ["Kesehatan", "keluar", ""],
  ["Pendidikan", "keluar", ""],
  ["Sedekah", "keluar", ""],
  ["Biaya Admin Bank", "keluar", "BIAYA_ADMIN"],
  ["Lainnya", "keluar", ""],
];

const PANDUAN: [string, string][] = [
  ["Saku", "Template database Google Sheets, model v1.0 (multi-pengguna, master bersama)"],
  ["", ""],
  ["Aturan umum", "Header di baris 1 jangan diubah atau digeser. API membaca kolom berdasarkan urutan."],
  ["", "Akun & Kategori = master bersama semua pengguna, hanya admin yang mengubah."],
  ["", "Periode, SaldoAwal, Transaksi, Berulang, BerulangLewati, Tabungan milik satu pengguna lewat kolom user_id."],
  ["", "Relasi memakai ID (AK-…, KT-…). Nama akun/kategori boleh diganti, ID jangan."],
  ["", "Data master tidak dihapus, cukup aktif = FALSE."],
  ["", "Tanggal = teks yyyy-MM-dd · bulan = yyyy-MM · nominal = angka tanpa titik · boolean = TRUE/FALSE."],
  ["", "Kolom abu-abu (created_by/at, updated_by/at) diisi otomatis oleh API."],
  ["", "Saldo TIDAK disimpan, selalu dihitung: saldo_awal + masuk − keluar − biaya_admin ± transfer."],
  ["", ""],
  ["Langkah awal", "1. Upload file ini ke Google Drive lalu buka dengan Google Sheets (atau File → Import → Ganti spreadsheet)."],
  ["", "2. Share spreadsheet ke email service account sebagai Editor."],
  ["", "3. Buka aplikasi → Setup Awal (buat admin)."],
  ["", "4. Sesuaikan akun & kategori di halaman Master (admin) → tiap pengguna Mulai Periode Baru."],
  ["", ""],
  ["Sheet", SHEET_NAMES.join(" · ")],
  ["", "Detail setiap kolom ada di catatan (hover) pada header."],
];

// Ada di runtime exceljs tapi tidak ada di file .d.ts-nya
type WithValidations = ExcelJS.Worksheet & {
  dataValidations: { add(range: string, validation: ExcelJS.DataValidation): void };
};

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC2410C" } };
const AUDIT_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };

function addPanduan(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("Panduan");
  ws.columns = [{ width: 16 }, { width: 110 }];
  for (const row of PANDUAN) ws.addRow(row);
  ws.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFC2410C" } };
  ws.getCell("B1").font = { italic: true };
  ws.getColumn(1).eachCell((cell, row) => {
    if (row > 1) cell.font = { bold: true };
  });
}

function addSheet(wb: ExcelJS.Workbook, sheet: SheetName, seed: ExcelJS.CellValue[][]) {
  const ws = wb.addWorksheet(sheet, { views: [{ state: "frozen", ySplit: 1 }] });
  const columns = SCHEMA[sheet];
  const auditStart = columns.length - 4;

  ws.columns = columns.map(([nama, tipe]) => ({
    width: Math.max(nama.length + 4, tipe === "datetime" ? 28 : tipe === "teks" ? 16 : 14),
  }));

  const header = ws.addRow(columns.map(([nama]) => nama));
  header.eachCell((cell, col) => {
    const audit = col - 1 >= auditStart;
    cell.font = { bold: true, color: { argb: audit ? "FF404040" : "FFFFFFFF" } };
    cell.fill = audit ? AUDIT_FILL : HEADER_FILL;
    const nama = String(cell.value);
    const note = audit ? AUDIT_NOTE : NOTES[sheet]?.[nama];
    if (note) cell.note = note;
  });
  // Data awal ditulis sebelum pewarnaan audit, supaya mulai tepat di baris 2
  for (const row of seed) ws.addRow(row);

  columns.forEach(([nama], i) => {
    const col = columnLetter(i);
    const range = `${col}2:${col}${MAX_ROW}`;
    const values = ENUMS[sheet]?.[nama];
    if (values) {
      (ws as WithValidations).dataValidations.add(range, {
        type: "list",
        allowBlank: true,
        formulae: [`"${values.join(",")}"`],
        showErrorMessage: true,
        errorTitle: "Nilai tidak valid",
        error: `Pilih salah satu: ${values.join(", ")}`,
      });
    }
    if (i >= auditStart) {
      for (let r = 2; r <= 50; r++) ws.getCell(`${col}${r}`).fill = AUDIT_FILL;
    }
  });

}

const usedIds = new Set<string>();

function newId(sheet: keyof typeof ID_PREFIX): string {
  const id = generateId(ID_PREFIX[sheet], (x) => usedIds.has(x));
  usedIds.add(id);
  return id;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Saku";
  addPanduan(wb);

  const now = toWibIso(new Date());
  for (const sheet of SHEET_NAMES) {
    const seed: ExcelJS.CellValue[][] =
      sheet === "Akun"
        ? AKUN_AWAL.map(([nama, jenis], i) => [newId("Akun"), nama, jenis, i + 1, true, "SYSTEM", now, "", ""])
        : sheet === "Kategori"
          ? KATEGORI_AWAL.map(([nama, tipe, kode]) => [newId("Kategori"), nama, tipe, kode, true, "SYSTEM", now, "", ""])
          : [];
    addSheet(wb, sheet, seed);
  }

  await wb.xlsx.writeFile(OUTPUT);
  console.log(`Template ditulis ke ${OUTPUT}`);
}

await main();
