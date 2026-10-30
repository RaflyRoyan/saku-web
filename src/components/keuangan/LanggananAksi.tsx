import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/Button";
import { BottomSheet } from "../ui/BottomSheet";
import { ChipPicker } from "../ui/ChipPicker";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { FormError } from "../ui/FormError";
import { Input } from "../ui/Input";
import { MoneyInput } from "../ui/MoneyInput";
import type { Berulang } from "../../hooks/useBerulang";
import { useAkun } from "../../hooks/useMaster";
import { useToast } from "../../hooks/useToast";
import { invalidateKeuangan, type TransaksiTersimpan } from "../../hooks/useTransaksi";
import { ApiError, send } from "../../lib/api";
import { formatBulan, hariIni } from "../../lib/format";

function BayarForm({ b, bulan, onDone }: { b: Berulang; bulan: string; onDone: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const akun = useAkun();
  const [form, setForm] = useState({ nominal: b.nominal as number | null, akunId: b.akunId, tanggal: hariIni(), deskripsi: b.nama });
  const bayar = useMutation({
    mutationFn: () => send<TransaksiTersimpan>("POST", `/berulang/${b.id}/konfirmasi`, { bulan, ...form, nominal: form.nominal ?? 0 }),
    onSuccess: (res) => {
      invalidateKeuangan(qc);
      toast.show(`${b.nama} ${formatBulan(bulan)} dibayar`);
      for (const p of res.peringatan) toast.show(p, "peringatan");
      onDone();
    },
  });
  const fe = bayar.error instanceof ApiError ? bayar.error.errors : undefined;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        bayar.mutate();
      }}
    >
      <MoneyInput label="Nominal" value={form.nominal} onChange={(nominal) => setForm((f) => ({ ...f, nominal }))} error={fe?.nominal} autoFocus />
      <ChipPicker
        label="Dari akun"
        scroll
        value={form.akunId}
        options={(akun.data ?? []).map((a) => ({ value: a.id, label: a.nama }))}
        onChange={(akunId) => setForm((f) => ({ ...f, akunId }))}
        error={fe?.akunId}
      />
      <Input
        label="Tanggal"
        type="date"
        value={form.tanggal}
        onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
        error={fe?.tanggal}
      />
      <Input label="Deskripsi" value={form.deskripsi} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))} error={fe?.deskripsi} />
      <FormError error={bayar.error} />
      <Button type="submit" block loading={bayar.isPending}>
        Konfirmasi bayar
      </Button>
    </form>
  );
}

/** Tombol Lewati / Bayar (atau Batalkan lewati) untuk langganan di bulan tertentu (02 §6.8). */
export function LanggananAksi({ b, bulan, dilewati }: { b: Berulang; bulan: string; dilewati?: boolean }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [bayar, setBayar] = useState(false);
  const [lewati, setLewati] = useState(false);
  const label = formatBulan(bulan, true);

  const lewatiMut = useMutation({
    mutationFn: () => send("POST", `/berulang/${b.id}/lewati`, { bulan }),
    onSuccess: () => {
      invalidateKeuangan(qc);
      toast.show(`${b.nama} ${label} dilewati`);
      setLewati(false);
    },
  });
  const batalMut = useMutation({
    mutationFn: () => send("DELETE", `/berulang/${b.id}/lewati/${bulan}`),
    onSuccess: () => {
      invalidateKeuangan(qc);
      toast.show("Lewati dibatalkan");
    },
    onError: (e) => toast.show(e instanceof ApiError ? e.title : "Tidak bisa terhubung ke server.", "error"),
  });

  if (dilewati) {
    return (
      <Button variant="ghost" loading={batalMut.isPending} onClick={() => batalMut.mutate()}>
        Batalkan
      </Button>
    );
  }
  return (
    <>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setLewati(true)}>
          Lewati
        </Button>
        <Button onClick={() => setBayar(true)}>Bayar</Button>
      </div>
      <BottomSheet open={bayar} onClose={() => setBayar(false)} title={`Bayar ${b.nama} · ${label}`}>
        {bayar && <BayarForm b={b} bulan={bulan} onDone={() => setBayar(false)} />}
      </BottomSheet>
      <ConfirmDialog
        open={lewati}
        title={`Lewati ${b.nama} bulan ${label}?`}
        confirmLabel="Lewati"
        loading={lewatiMut.isPending}
        onConfirm={() => lewatiMut.mutate()}
        onClose={() => setLewati(false)}
      >
        Tidak ada transaksi yang dicatat, dan pengingat bulan ini disembunyikan. Bisa dibatalkan nanti.
        <FormError error={lewatiMut.error} />
      </ConfirmDialog>
    </>
  );
}
