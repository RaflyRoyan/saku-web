import { formatRupiah } from "../../lib/format";

const WARNA = { masuk: "text-masuk", keluar: "text-keluar", transfer: "text-stone-900" } as const;

/** Nominal dengan tanda & warna sesuai tipe: `+Rp 500.000` hijau, `−Rp 25.000` merah, transfer netral (02 §4.3). */
export function AmountText({ tipe, nominal, className = "" }: { tipe: string; nominal: number; className?: string }) {
  const tanda = tipe === "masuk" ? "+" : tipe === "keluar" ? "−" : "";
  return (
    <span className={`font-bold tabular-nums ${WARNA[tipe as keyof typeof WARNA] ?? ""} ${className}`}>
      {tanda}
      {formatRupiah(nominal)}
    </span>
  );
}

/** Saldo: minus merah dengan tanda minus. */
export function SaldoText({ saldo, className = "" }: { saldo: number; className?: string }) {
  return <span className={`font-bold tabular-nums ${saldo < 0 ? "text-keluar" : ""} ${className}`}>{formatRupiah(saldo)}</span>;
}
