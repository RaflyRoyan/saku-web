import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, CalendarRange, ChevronRight } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { AkunIcon } from "../components/keuangan/AkunIcon";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button, fokus } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FormError } from "../components/ui/FormError";
import { Input } from "../components/ui/Input";
import { MoneyInput } from "../components/ui/MoneyInput";
import { EmptyState, ErrorState, ListSkeleton } from "../components/ui/States";
import { usePeriodeList, useRingkasan, type Periode, type Ringkasan } from "../hooks/usePeriode";
import { useToast } from "../hooks/useToast";
import { invalidateKeuangan } from "../hooks/useTransaksi";
import { ApiError, send } from "../lib/api";
import { formatRupiah, formatTanggal } from "../lib/format";

/** Ubah nama, keterangan, dan saldo awal satu periode (spec §10.5). */
function UbahPeriodeForm({ periode, ringkasan, onDone }: { periode: Periode; ringkasan: Ringkasan; onDone: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const awal = Object.fromEntries(ringkasan.perAkun.map((a) => [a.akunId, a.saldoAwal || null]));
  const [nama, setNama] = useState(periode.nama);
  const [keterangan, setKeterangan] = useState(periode.keterangan);
  const [saldo, setSaldo] = useState<Record<string, number | null>>(awal);

  // Saldo 0/kosong tidak dikirim: baris saldo awalnya dihapus di server
  const items = ringkasan.perAkun.filter((a) => saldo[a.akunId]).map((a) => ({ akunId: a.akunId, saldo: saldo[a.akunId] ?? 0 }));
  const total = items.reduce((n, s) => n + s.saldo, 0);
  const saldoBerubah = ringkasan.perAkun.some((a) => (saldo[a.akunId] ?? 0) !== a.saldoAwal);

  const simpan = useMutation({
    mutationFn: async () => {
      if (nama !== periode.nama || keterangan !== periode.keterangan) {
        await send("PUT", `/periode/${periode.id}`, { nama, keterangan });
      }
      if (saldoBerubah) await send("PUT", `/periode/${periode.id}/saldo-awal`, { saldoAwal: items });
    },
    onSuccess: () => {
      invalidateKeuangan(qc);
      toast.show("Periode disimpan");
      onDone();
    },
    // Bagian yang sudah tersimpan tetap tampil benar walau langkah berikutnya gagal
    onError: () => invalidateKeuangan(qc),
  });
  const fe = simpan.error instanceof ApiError ? simpan.error.errors : undefined;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        simpan.mutate();
      }}
    >
      <Input label="Nama" value={nama} maxLength={50} onChange={(e) => setNama(e.target.value)} error={fe?.nama} />
      <Input label="Keterangan" value={keterangan} maxLength={200} placeholder="Opsional" onChange={(e) => setKeterangan(e.target.value)} error={fe?.keterangan} />
      <p className="text-sm text-stone-500">
        {formatTanggal(periode.tanggalMulai)} – {periode.tanggalSelesai ? formatTanggal(periode.tanggalSelesai) : "sekarang"}. Tanggal tidak bisa diubah.
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-stone-500">Saldo awal</legend>
        <Card className="flex flex-col divide-y divide-garis">
          {ringkasan.perAkun.map((a) => (
            <div key={a.akunId} className="flex items-center gap-3 px-3 py-2">
              <span className="flex w-28 shrink-0 items-center gap-2 text-sm font-semibold">
                <AkunIcon jenis={a.jenis} className="size-4 shrink-0 text-brand-600" />
                <span className="truncate">{a.nama}</span>
              </span>
              <div className="min-w-0 flex-1 [&_label]:sr-only">
                <MoneyInput
                  label={`Saldo awal ${a.nama}`}
                  value={saldo[a.akunId] ?? null}
                  onChange={(v) => setSaldo((s) => ({ ...s, [a.akunId]: v }))}
                  error={fe?.[`saldoAwal.${items.findIndex((x) => x.akunId === a.akunId)}.akunId`]}
                />
              </div>
            </div>
          ))}
          <div className="flex justify-between px-3 py-3 font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatRupiah(total)}</span>
          </div>
        </Card>
      </fieldset>
      {periode.tanggalSelesai && saldoBerubah && (
        <p className="rounded-xl bg-yellow-50 px-3 py-2 text-sm text-stone-700">
          Periode ini sudah ditutup. Setoran tabungan dari periode ini akan dihitung ulang.
        </p>
      )}
      <FormError error={simpan.error} />
      <Button type="submit" block loading={simpan.isPending}>
        Simpan
      </Button>
    </form>
  );
}

function UbahPeriode({ periode, onDone }: { periode: Periode; onDone: () => void }) {
  const ringkasan = useRingkasan(periode.id);
  if (ringkasan.isPending) return <ListSkeleton rows={3} />;
  if (ringkasan.isError) return <ErrorState error={ringkasan.error} onRetry={() => ringkasan.refetch()} />;
  return <UbahPeriodeForm periode={periode} ringkasan={ringkasan.data} onDone={onDone} />;
}

export default function PeriodePage() {
  const list = usePeriodeList();
  const [edit, setEdit] = useState<Periode | null>(null);

  const mulai = (
    <Link
      to="/periode/baru"
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 ${fokus}`}
    >
      <CalendarPlus className="size-4" aria-hidden />
      Mulai baru
    </Link>
  );

  return (
    <>
      <PageHeader title="Periode" action={list.data?.length ? mulai : undefined} />
      {list.isPending ? (
        <ListSkeleton />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : list.data.length === 0 ? (
        <EmptyState icon={CalendarRange} title="Belum ada periode." action={mulai} />
      ) : (
        <Card className="divide-y divide-garis overflow-hidden">
          {list.data.map((p) => (
            <button key={p.id} type="button" onClick={() => setEdit(p)} className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-50 ${fokus}`}>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-semibold">{p.nama}</span>
                  {p.aktif && <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">Aktif</span>}
                </span>
                <span className="block truncate text-sm text-stone-500">
                  {formatTanggal(p.tanggalMulai)} – {p.tanggalSelesai ? formatTanggal(p.tanggalSelesai) : "sekarang"}
                  {p.keterangan ? ` · ${p.keterangan}` : ""}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-stone-400" aria-hidden />
            </button>
          ))}
        </Card>
      )}
      <BottomSheet open={edit !== null} onClose={() => setEdit(null)} title="Ubah periode">
        {edit && <UbahPeriode key={edit.id} periode={edit} onDone={() => setEdit(null)} />}
      </BottomSheet>
    </>
  );
}
