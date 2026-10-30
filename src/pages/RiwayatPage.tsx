import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { History, Search, X } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { PeriodeKosong } from "../components/keuangan/PeriodeKosong";
import { TransaksiGroupList } from "../components/keuangan/TransaksiItem";
import { Button, fokus } from "../components/ui/Button";
import { EmptyState, ErrorState, ListSkeleton } from "../components/ui/States";
import { useAkun, useKategori } from "../hooks/useMaster";
import { usePeriodeList, usePeriodeTerpilih } from "../hooks/usePeriode";
import { useTransaksiList } from "../hooks/useTransaksi";

const TIPE = [
  { value: "keluar", label: "Keluar" },
  { value: "masuk", label: "Masuk" },
  { value: "transfer", label: "Transfer" },
];

interface FilterChipProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  /** Filter yang tidak bisa dihapus (periode) tetap tampil biasa. */
  wajib?: boolean;
}

/** Chip filter: select bawaan di dalam chip; aktif → warna brand + tombol ✕ (02 §6.6). */
function FilterChip({ label, value, options, onChange, wajib }: FilterChipProps) {
  const aktif = Boolean(value) && !wajib;
  return (
    <span
      className={`relative flex min-h-10 shrink-0 items-center rounded-full border text-sm font-semibold ${
        aktif ? "border-brand-700 bg-brand-50 text-brand-700" : "border-garis bg-white text-stone-700"
      }`}
    >
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-10 max-w-44 appearance-none truncate rounded-full bg-transparent pr-3 pl-4 ${aktif ? "pr-9" : ""} ${fokus}`}
      >
        {!wajib && <option value="">{label}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {aktif && (
        <button
          type="button"
          aria-label={`Hapus filter ${label}`}
          onClick={() => onChange("")}
          className={`absolute right-1 flex size-8 items-center justify-center rounded-full hover:bg-brand-100 ${fokus}`}
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </span>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function RiwayatPage() {
  const [params, setParams] = useSearchParams();
  const { aktif, periodeId } = usePeriodeTerpilih(params.get("periode"));
  const periodeList = usePeriodeList();
  const akun = useAkun(true);
  const kategori = useKategori(true);
  const [cari, setCari] = useState(params.get("q") ?? "");
  const q = useDebounced(cari.trim(), 300);

  const filter = {
    periodeId,
    akunId: params.get("akunId") ?? "",
    tipe: params.get("tipe") ?? "",
    kategoriId: params.get("kategoriId") ?? "",
    q,
  };
  const list = useTransaksiList(filter, 50, Boolean(periodeId));

  const setFilter = (key: string, value: string) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (value && !(key === "periode" && value === aktif.data?.id)) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (q) next.set("q", q);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  }, [q, setParams]);

  let isi: ReactNode;
  if (aktif.isPending || (periodeId && list.isPending)) isi = <ListSkeleton rows={5} />;
  else if (aktif.isError) isi = <ErrorState error={aktif.error} onRetry={() => aktif.refetch()} />;
  else if (!periodeId) isi = <PeriodeKosong />;
  else if (list.isError) isi = <ErrorState error={list.error} onRetry={() => list.refetch()} />;
  else {
    const items = list.data!.pages.flatMap((p) => p.data);
    const adaFilter = filter.akunId || filter.tipe || filter.kategoriId || q;
    isi =
      items.length === 0 ? (
        <EmptyState icon={History} title={adaFilter ? "Tidak ada transaksi yang cocok." : "Belum ada transaksi di periode ini."} />
      ) : (
        <div className="flex flex-col gap-4">
          <TransaksiGroupList items={items} />
          {list.hasNextPage && (
            <Button variant="secondary" loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
              Muat lebih banyak
            </Button>
          )}
        </div>
      );
  }

  const kategoriOptions = (kategori.data ?? [])
    // Transfer hanya punya "kategori" biaya admin
    .filter((k) => (filter.tipe === "transfer" ? k.kodeSistem === "BIAYA_ADMIN" : !filter.tipe || k.tipe === filter.tipe))
    .map((k) => ({ value: k.id, label: k.nama }));

  return (
    <>
      <PageHeader title="Riwayat" />
      <div className="mb-4 flex flex-col gap-3">
        <label className="relative block">
          <span className="sr-only">Cari deskripsi</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-stone-400" aria-hidden />
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari deskripsi"
            className="min-h-11 w-full rounded-xl border border-garis bg-white pr-3 pl-10 text-base placeholder:text-stone-400 focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:outline-none"
          />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {periodeId && (
            <FilterChip
              label="Periode"
              wajib
              value={periodeId}
              options={(periodeList.data ?? []).map((p) => ({ value: p.id, label: p.aktif ? `${p.nama} (ini)` : p.nama }))}
              onChange={(v) => setFilter("periode", v)}
            />
          )}
          <FilterChip
            label="Akun"
            value={filter.akunId}
            options={(akun.data ?? []).map((a) => ({ value: a.id, label: a.nama }))}
            onChange={(v) => setFilter("akunId", v)}
          />
          <FilterChip label="Tipe" value={filter.tipe} options={TIPE} onChange={(v) => setFilter("tipe", v)} />
          <FilterChip label="Kategori" value={filter.kategoriId} options={kategoriOptions} onChange={(v) => setFilter("kategoriId", v)} />
        </div>
      </div>
      {isi}
    </>
  );
}
