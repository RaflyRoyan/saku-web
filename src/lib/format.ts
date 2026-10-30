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
