import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import type { Transaksi } from "../../hooks/useTransaksi";
import { formatGrupTanggal, formatRupiah, formatRupiahRingkas, formatTanggal } from "../../lib/format";
import { fokus } from "../ui/Button";
import { AmountText } from "./AmountText";

const IKON = {
  keluar: { icon: ArrowUpRight, cls: "bg-rose-50 text-keluar" },
  masuk: { icon: ArrowDownLeft, cls: "bg-emerald-50 text-masuk" },
  transfer: { icon: ArrowLeftRight, cls: "bg-violet-50 text-transfer" },
} as const;

/** Satu baris transaksi (02 §5.3). Tap → form edit; tarik tabungan → halaman Tabungan. */
export function TransaksiItem({ t }: { t: Transaksi }) {
  const { icon: Icon, cls } = IKON[t.tipe];
  const tarik = t.kodeSistem === "TARIK_TABUNGAN";
  const rute = `${t.akunNama} → ${t.akunTujuanNama}`;
  const judul = t.deskripsi || (t.tipe === "transfer" ? rute : (t.kategoriNama ?? "Tanpa kategori"));
  const detail =
    t.tipe === "transfer"
      ? [t.deskripsi ? rute : "Transfer", t.biayaAdmin ? `admin ${formatRupiah(t.biayaAdmin)}` : ""]
      : [t.kategoriNama, t.akunNama];

  return (
    <Link to={tarik ? "/tabungan" : `/transaksi/${t.id}`} className={`flex items-center gap-3 px-4 py-3 hover:bg-brand-50 ${fokus}`}>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${cls}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-semibold">{judul}</span>
          {tarik && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-tabungan">Tabungan</span>}
        </span>
        <span className="block truncate text-sm text-stone-500">{detail.filter(Boolean).join(" · ")}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <AmountText tipe={t.tipe} nominal={t.nominal} />
        <span className="text-xs text-stone-500">{formatTanggal(t.tanggal)}</span>
      </span>
    </Link>
  );
}

/** Daftar transaksi dikelompokkan per tanggal + total keluar hari itu (02 §6.6). */
export function TransaksiGroupList({ items }: { items: Transaksi[] }) {
  const groups: { tanggal: string; items: Transaksi[] }[] = [];
  for (const t of items) {
    const last = groups.at(-1);
    if (last?.tanggal === t.tanggal) last.items.push(t);
    else groups.push({ tanggal: t.tanggal, items: [t] });
  }
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => {
        // Keluar hari itu = pengeluaran + biaya admin transfer
        const keluar = g.items.reduce((n, t) => n + (t.tipe === "keluar" ? t.nominal : t.biayaAdmin), 0);
        return (
          <section key={g.tanggal} aria-label={formatGrupTanggal(g.tanggal)}>
            <div className="mb-1.5 flex items-center justify-between px-1 text-sm">
              <h2 className="font-semibold text-stone-700">{formatGrupTanggal(g.tanggal)}</h2>
              {keluar > 0 && <span className="font-semibold text-keluar tabular-nums">−{formatRupiahRingkas(keluar)}</span>}
            </div>
            <div className="divide-y divide-garis overflow-hidden rounded-2xl border border-garis bg-white shadow-sm">
              {g.items.map((t) => (
                <TransaksiItem key={t.id} t={t} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
