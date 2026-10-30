const angka = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** `Rp 2.997.500`, minus → `-Rp 25.000`. Untuk pesan error/peringatan dari server. */
export function formatRupiah(n: number): string {
  const s = `Rp ${angka.format(Math.abs(n))}`;
  return n < 0 ? `-${s}` : s;
}
