import { Link } from "react-router-dom";
import { ChevronRight, Receipt, Settings } from "lucide-react";
import { AkunIcon } from "../components/keuangan/AkunIcon";
import { PeriodeKosong } from "../components/keuangan/PeriodeKosong";
import { TransaksiItem } from "../components/keuangan/TransaksiItem";
import { fokus } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, ErrorState, ListSkeleton, Skeleton } from "../components/ui/States";
import { useMe } from "../hooks/useAuth";
import { usePeriodeAktif, useRingkasan } from "../hooks/usePeriode";
import { useTransaksiList } from "../hooks/useTransaksi";
import { formatPeriode, formatRupiah, formatRupiahRingkas } from "../lib/format";

function Judul({ title, to, link }: { title: string; to: string; link: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="font-bold">{title}</h2>
      <Link to={to} className={`flex items-center text-sm font-semibold text-brand-700 ${fokus}`}>
        {link}
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

/** Beranda (02 §6.2). Pengingat langganan, donut kategori, dan tabungan menyusul di M6. */
export default function DashboardPage() {
  const { data: me } = useMe();
  const aktif = usePeriodeAktif();
  const ringkasan = useRingkasan(aktif.data?.id);
  const terakhir = useTransaksiList({ periodeId: aktif.data?.id }, 5, Boolean(aktif.data));

  const sapa = (
    <header className="mb-4 flex items-start justify-between gap-3 pt-2">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold">Halo, {me?.nama ?? ""}</h1>
        {ringkasan.data && <p className="truncate text-sm text-stone-500">{formatPeriode(ringkasan.data.periode)}</p>}
      </div>
      <Link to="/pengaturan" aria-label="Pengaturan" className={`flex size-11 items-center justify-center rounded-xl text-stone-500 hover:bg-brand-50 lg:hidden ${fokus}`}>
        <Settings className="size-5" aria-hidden />
      </Link>
    </header>
  );

  if (aktif.isPending || (aktif.data && ringkasan.isPending)) {
    return (
      <>
        {sapa}
        <Skeleton className="mb-4 h-40" />
        <ListSkeleton />
      </>
    );
  }
  if (aktif.isError) return <ErrorState error={aktif.error} onRetry={() => aktif.refetch()} />;
  if (!aktif.data) {
    return (
      <>
        {sapa}
        <PeriodeKosong />
      </>
    );
  }
  if (ringkasan.isError) return <ErrorState error={ringkasan.error} onRetry={() => ringkasan.refetch()} />;

  const r = ringkasan.data!;
  const items = terakhir.data?.pages[0]?.data ?? [];
  return (
    <>
      {sapa}
      <div className="flex flex-col gap-6">
        <div className="bg-sunrise rounded-2xl p-5 text-white shadow-lg shadow-rose-900/20">
          <p className="text-sm text-white/80">Total saldo</p>
          <p className="text-3xl font-extrabold tabular-nums">{formatRupiah(r.totalSaldoAkhir)}</p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-white/80">Keluar periode ini</p>
              <p className="text-lg font-bold tabular-nums">{formatRupiah(r.totalPengeluaran)}</p>
            </div>
            <Link to="/akun" className={`flex items-center rounded-lg text-sm font-semibold text-white ${fokus} focus-visible:ring-white`}>
              Detail
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>

        {r.perAkun.length === 0 ? (
          <Card className="p-4 text-sm text-stone-700">
            Belum ada akun. Tambahkan dulu di{" "}
            <Link to="/master" className="font-semibold text-brand-700 underline">
              Master
            </Link>
            .
          </Card>
        ) : (
          <section>
            <Judul title="Saldo per akun" to="/akun" link="Lihat" />
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {r.perAkun.map((a) => (
                <Link
                  key={a.akunId}
                  to={`/akun/${a.akunId}`}
                  className={`flex w-32 shrink-0 flex-col gap-1 rounded-2xl border border-garis bg-white p-3 shadow-sm hover:bg-brand-50 ${fokus}`}
                >
                  <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-stone-700">
                    <AkunIcon jenis={a.jenis} className="size-4 shrink-0 text-brand-600" />
                    {a.nama}
                  </span>
                  <span className={`font-bold tabular-nums ${a.saldoAkhir < 0 ? "text-keluar" : ""}`}>{formatRupiahRingkas(a.saldoAkhir)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <Judul title="Transaksi terakhir" to="/riwayat" link="Semua" />
          {terakhir.isPending ? (
            <ListSkeleton />
          ) : terakhir.isError ? (
            <ErrorState error={terakhir.error} onRetry={() => terakhir.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Belum ada transaksi di periode ini."
              action={
                <Link to="/transaksi/baru" className={`font-semibold text-brand-700 ${fokus}`}>
                  Catat transaksi
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-garis overflow-hidden rounded-2xl border border-garis bg-white shadow-sm">
              {items.map((t) => (
                <TransaksiItem key={t.id} t={t} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
