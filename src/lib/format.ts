// Semua format tampilan (02 §4.3). Locale id-ID, zona WIB.

const angka = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** `Rp 2.997.500`, minus → `−Rp 25.000`. */
export function formatRupiah(n: number): string {
  const s = `Rp ${angka.format(Math.abs(n))}`;
  return n < 0 ? `−${s}` : s;
}

const WIB = "Asia/Jakarta";

/** Terima `yyyy-MM-dd` (dianggap WIB) atau ISO datetime. */
function toDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+07:00`) : new Date(value);
}

function tahunWib(d: Date): number {
  return Number(new Intl.DateTimeFormat("id-ID", { year: "numeric", timeZone: WIB }).format(d));
}

/** List: `29 Okt`; tahun hanya kalau beda dengan tahun ini. */
export function formatTanggal(value: string, now = new Date()): string {
  const d = toDate(value);
  const sameYear = tahunWib(d) === tahunWib(now);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone: WIB,
  }).format(d);
}

/** Header/detail: `Kamis, 29 Oktober 2026`. */
export function formatTanggalPanjang(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WIB,
  }).format(toDate(value));
}

/** Datetime: `29 Okt 2026, 10.15`. */
export function formatWaktu(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: WIB,
  }).format(toDate(value));
}

/** Ringkas untuk chip/grafik: `Rp 3 jt`, `Rp 2,99 jt`, `Rp 250 rb`. */
export function formatRupiahRingkas(n: number): string {
  const abs = Math.abs(n);
  const tanda = n < 0 ? "−" : "";
  const satu = (v: number, max: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: max }).format(v);
  if (abs >= 1_000_000_000) return `${tanda}Rp ${satu(Math.floor(abs / 10_000_000) / 100, 2)} M`;
  if (abs >= 1_000_000) return `${tanda}Rp ${satu(Math.floor(abs / 10_000) / 100, 2)} jt`;
  if (abs >= 1_000) return `${tanda}Rp ${satu(Math.floor(abs / 100) / 10, 1)} rb`;
  return formatRupiah(n);
}

/** Angka dengan titik ribuan tanpa `Rp`: `2.997.500`. */
export function formatAngka(n: number): string {
  return angka.format(n);
}

/** Hari ini di WIB, `yyyy-MM-dd`. */
export function hariIni(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: WIB }).format(now);
}

/** `yyyy-MM-dd` + n hari. */
export function tambahHari(tanggal: string, n: number): string {
  const d = new Date(`${tanggal}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Header grup riwayat: `Hari ini`, `Kemarin`, `Senin, 27 Okt`. */
export function formatGrupTanggal(tanggal: string, now = new Date()): string {
  const today = hariIni(now);
  if (tanggal === today) return "Hari ini";
  if (tanggal === tambahHari(today, -1)) return "Kemarin";
  const d = toDate(tanggal);
  const sameYear = tahunWib(d) === tahunWib(now);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone: WIB,
  }).format(d);
}

/** `Gajian Okt · 25 Okt – sekarang`. */
export function formatPeriode(p: { nama: string; tanggalMulai: string; tanggalSelesai: string | null }): string {
  const akhir = p.tanggalSelesai ? formatTanggal(p.tanggalSelesai) : "sekarang";
  return `${p.nama} · ${formatTanggal(p.tanggalMulai)} – ${akhir}`;
}
