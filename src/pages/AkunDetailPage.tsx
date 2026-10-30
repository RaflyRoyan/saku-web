import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Receipt } from "lucide-react";
import { AkunIcon } from "../components/keuangan/AkunIcon";
import { SaldoText } from "../components/keuangan/AmountText";
import { PeriodeKosong } from "../components/keuangan/PeriodeKosong";
import { PeriodeSelect } from "../components/keuangan/PeriodeSelect";
import { TransaksiGroupList } from "../components/keuangan/TransaksiItem";
import { Button, fokus } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, ErrorState, ListSkeleton } from "../components/ui/States";
import { usePeriodeTerpilih, useRingkasan, type PerKategori } from "../hooks/usePeriode";
import { useTransaksiList } from "../hooks/useTransaksi";
import { formatPeriode, formatRupiah } from "../lib/format";
import { RincianAkun } from "./AkunPage";

/** Bar pengeluaran per kategori untuk satu akun (02 §6.5). */
function KategoriBar({ items }: { items: PerKategori[] }) {
  const max = Math.max(...items.map((k) => k.total));
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((k) => (
        <li key={k.kategoriId} className="flex flex-col gap-1 text-sm">
          <span className="flex justify-between gap-3">
            <span className="truncate font-medium text-stone-700">{k.nama}</span>
            <span className="font-semibold tabular-nums">{formatRupiah(k.total)}</span>
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-rose-50">
            <span className="block h-full rounded-full bg-keluar/70" style={{ width: `${(k.total / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function AkunDetailPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const { aktif, periodeId } = usePeriodeTerpilih(params.get("periode"));
  const ringkasan = useRingkasan(periodeId);
  const list = useTransaksiList({ periodeId, akunId: id }, 50, Boolean(periodeId));
  const a = ringkasan.data?.perAkun.find((x) => x.akunId === id);

  const back = (
    <Link to={`/akun${params.get("periode") ? `?periode=${params.get("periode")}` : ""}`} aria-label="Kembali ke Akun" className={`flex size-11 items-center justify-center rounded-xl text-stone-500 hover:bg-brand-50 ${fokus}`}>
      <ArrowLeft className="size-5" aria-hidden />
    </Link>
  );
  const header = (
    <header className="sticky top-0 z-10 -mx-4 mb-4 flex min-h-14 items-center gap-2 border-b border-garis bg-white px-2 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
      {back}
      <h1 className="flex flex-1 items-center gap-2 truncate text-xl font-bold">
        {a && <AkunIcon jenis={a.jenis} className="size-5 text-brand-600" />}
        {a?.nama ?? "Detail Akun"}
      </h1>
      {periodeId && <PeriodeSelect value={periodeId} onChange={(p) => setParams(p === aktif.data?.id ? {} : { periode: p })} />}
    </header>
  );

  if (aktif.isPending || (periodeId && ringkasan.isPending)) {
    return (
      <>
        {header}
        <ListSkeleton rows={4} />
      </>
    );
  }
  if (aktif.isError) return <ErrorState error={aktif.error} onRetry={() => aktif.refetch()} />;
  if (!periodeId) {
    return (
      <>
        {header}
        <PeriodeKosong />
      </>
    );
  }
  if (ringkasan.isError) return <ErrorState error={ringkasan.error} onRetry={() => ringkasan.refetch()} />;
  if (!a) {
    return (
      <>
        {header}
        <EmptyState icon={Receipt} title="Akun tidak ditemukan di periode ini." />
      </>
    );
  }

  const items = list.data?.pages.flatMap((p) => p.data) ?? [];
  return (
    <>
      {header}
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-sm text-stone-500">{formatPeriode(ringkasan.data!.periode)}</p>
          <SaldoText saldo={a.saldoAkhir} className="text-3xl" />
          <hr className="border-garis" />
          <RincianAkun a={a} />
        </Card>

        {a.pengeluaranPerKategori.length > 0 && (
          <Card className="flex flex-col gap-3 p-4">
            <h2 className="font-bold">Pengeluaran per kategori</h2>
            <KategoriBar items={a.pengeluaranPerKategori} />
          </Card>
        )}

        <h2 className="font-bold">Transaksi</h2>
        {list.isPending ? (
          <ListSkeleton />
        ) : list.isError ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon={Receipt} title="Belum ada transaksi di akun ini." />
        ) : (
          <>
            <TransaksiGroupList items={items} />
            {list.hasNextPage && (
              <Button variant="secondary" loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
                Muat lebih banyak
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
}
