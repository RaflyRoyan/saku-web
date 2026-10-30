import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { AkunIcon } from "../components/keuangan/AkunIcon";
import { TransaksiItem } from "../components/keuangan/TransaksiItem";
import { Button, fokus } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FormError } from "../components/ui/FormError";
import { Input } from "../components/ui/Input";
import { MoneyInput } from "../components/ui/MoneyInput";
import { ErrorState, ListSkeleton } from "../components/ui/States";
import { useAkun } from "../hooks/useMaster";
import { usePeriodeAktif, type Periode } from "../hooks/usePeriode";
import { invalidateKeuangan, type Transaksi } from "../hooks/useTransaksi";
import { ApiError, api } from "../lib/api";
import { formatRupiah, formatTanggalPanjang, hariIni, tambahHari } from "../lib/format";

interface Hasil {
  periode: Periode;
  setorTabungan: { akunId: string; nominal: number }[];
  totalTabungan: number;
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const namaDefault = (tanggal: string) => {
  const [y, m, d] = tanggal.split("-").map(Number);
  return `Periode ${d} ${BULAN[m - 1]} ${y}`;
};

function Langkah({ aktif, total, label }: { aktif: number; total: number; label: string }) {
  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < aktif ? "bg-brand-600" : "bg-brand-100"}`} />
        ))}
      </div>
      <p className="text-sm font-semibold text-stone-500">
        Langkah {aktif} dari {total} · {label}
      </p>
    </div>
  );
}

/**
 * Mulai periode baru (02 §6.7). Langkah pratinjau tutup periode (sisa → tabungan) menyusul di M5;
 * di sini: isi saldo awal lalu konfirmasi.
 */
export default function PeriodeBaruPage() {
  const qc = useQueryClient();
  const aktif = usePeriodeAktif();
  const akun = useAkun();
  const [langkah, setLangkah] = useState<1 | 2>(1);
  const [tanggal, setTanggal] = useState(hariIni());
  const [nama, setNama] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [saldo, setSaldo] = useState<Record<string, number | null>>({});

  const items = Object.entries(saldo)
    .filter(([, v]) => v)
    .map(([akunId, v]) => ({ akunId, saldo: v ?? 0 }));
  const total = items.reduce((n, s) => n + s.saldo, 0);

  const mulai = useMutation({
    mutationFn: () =>
      api<Hasil>("/periode/mulai", {
        method: "POST",
        body: JSON.stringify({ nama: nama.trim() || undefined, tanggalMulai: tanggal, keterangan: keterangan.trim() || undefined, saldoAwal: items }),
      }),
    onSuccess: () => invalidateKeuangan(qc),
    // Error per field ada di langkah 1
    onError: (e) => {
      if (e instanceof ApiError && e.errors) setLangkah(1);
    },
  });
  const err = mulai.error instanceof ApiError ? mulai.error : null;

  if (aktif.isPending || akun.isPending) return <ListSkeleton rows={4} />;
  if (aktif.isError) return <ErrorState error={aktif.error} onRetry={() => aktif.refetch()} />;
  if (akun.isError) return <ErrorState error={akun.error} onRetry={() => akun.refetch()} />;

  if (mulai.data) {
    const h = mulai.data;
    return (
      <>
        <PageHeader title="Periode dimulai" />
        <Card className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <CircleCheck className="size-12 text-masuk" aria-hidden />
          <h2 className="text-lg font-bold">{h.periode.nama}</h2>
          <p className="text-sm text-stone-500">Mulai {formatTanggalPanjang(h.periode.tanggalMulai)}</p>
          <p className="text-sm">
            Saldo awal <span className="font-bold">{formatRupiah(total)}</span>
          </p>
          {h.setorTabungan.length > 0 && (
            <p className="text-sm">
              Masuk tabungan <span className="font-bold text-tabungan">{formatRupiah(h.setorTabungan.reduce((n, s) => n + s.nominal, 0))}</span>
            </p>
          )}
          <Link to="/" className={`mt-2 inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 ${fokus}`}>
            Ke Beranda
          </Link>
        </Card>
      </>
    );
  }

  const lama = aktif.data;
  const minTanggal = lama ? tambahHari(lama.tanggalMulai, 1) : undefined;
  const bentrok = err?.status === 409 ? ((err.extra.transaksi as Transaksi[] | undefined) ?? []) : [];

  return (
    <>
      <PageHeader title="Mulai periode baru" />
      {langkah === 1 ? (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            mulai.reset();
            setLangkah(2);
            window.scrollTo(0, 0);
          }}
        >
          <Langkah aktif={1} total={2} label="Saldo awal" />
          <Input label="Nama" value={nama} placeholder={namaDefault(tanggal)} maxLength={50} onChange={(e) => setNama(e.target.value)} error={err?.errors?.nama} />
          <Input
            label="Mulai"
            type="date"
            value={tanggal}
            min={minTanggal}
            onChange={(e) => setTanggal(e.target.value)}
            error={err?.errors?.tanggalMulai}
          />
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-stone-700">
            Isi gaji di akun penerima. Pembagian ke akun lain bisa dicatat sebagai transfer.
          </p>
          {akun.data.length === 0 ? (
            <p className="text-sm text-stone-500">Belum ada akun aktif. Admin bisa menambahkan akun di Master.</p>
          ) : (
            <Card className="flex flex-col divide-y divide-garis">
              {akun.data.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-2">
                  <span className="flex w-32 shrink-0 items-center gap-2 truncate text-sm font-semibold">
                    <AkunIcon jenis={a.jenis} className="size-4 text-brand-600" />
                    {a.nama}
                  </span>
                  <div className="flex-1 [&_label]:sr-only">
                    <MoneyInput
                      label={`Saldo awal ${a.nama}`}
                      value={saldo[a.id] ?? null}
                      onChange={(v) => setSaldo((s) => ({ ...s, [a.id]: v }))}
                      error={err?.errors?.[`saldoAwal.${items.findIndex((x) => x.akunId === a.id)}.akunId`]}
                      autoFocus={i === 0}
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3 font-bold">
                <span>Total</span>
                <span className="tabular-nums">{formatRupiah(total)}</span>
              </div>
            </Card>
          )}
          <Input label="Keterangan" value={keterangan} placeholder="Opsional" maxLength={200} onChange={(e) => setKeterangan(e.target.value)} />
          <Button type="submit" block>
            Lanjut
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <Langkah aktif={2} total={2} label="Konfirmasi" />
          <Card className="flex flex-col gap-4 p-4">
            {lama && (
              <div>
                <p className="text-sm text-stone-500">Periode lama ditutup</p>
                <p className="font-bold">
                  {lama.nama} · {formatTanggalPanjang(tambahHari(tanggal, -1))}
                </p>
                <p className="text-sm text-stone-500">Sisa saldo setiap akun masuk tabungan.</p>
              </div>
            )}
            <div>
              <p className="text-sm text-stone-500">Periode baru</p>
              <p className="font-bold">
                {nama.trim() || namaDefault(tanggal)} · mulai {formatTanggalPanjang(tanggal)}
              </p>
            </div>
            <div>
              <p className="text-sm text-stone-500">Saldo awal baru</p>
              <p className="text-2xl font-extrabold tabular-nums">{formatRupiah(total)}</p>
            </div>
          </Card>

          {bentrok.length > 0 && (
            <div role="alert" className="flex flex-col gap-2">
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-keluar">{err?.title}</p>
              <div className="divide-y divide-garis overflow-hidden rounded-2xl border border-garis bg-white">
                {bentrok.map((t) => (
                  <TransaksiItem key={t.id} t={t} />
                ))}
              </div>
            </div>
          )}
          {bentrok.length === 0 && !err?.errors && <FormError error={mulai.error} />}

          <Button block loading={mulai.isPending} onClick={() => mulai.mutate()}>
            Mulai periode
          </Button>
          <Button variant="secondary" block onClick={() => setLangkah(1)} disabled={mulai.isPending}>
            Kembali
          </Button>
        </div>
      )}
    </>
  );
}
