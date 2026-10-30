import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Banknote, ChevronDown, ChevronUp, Landmark, Plus, Tags, Wallet, type LucideIcon } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button, fokus } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FormError } from "../components/ui/FormError";
import { Input, Select, Switch } from "../components/ui/Input";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { EmptyState, ErrorState, ListSkeleton } from "../components/ui/States";
import { useMe } from "../hooks/useAuth";
import { masterKeys, useAkun, useKategori, type Akun, type JenisAkun, type Kategori, type TipeKategori } from "../hooks/useMaster";
import { useToast } from "../hooks/useToast";
import { ApiError, send } from "../lib/api";
import { formatRupiah } from "../lib/format";

const JENIS: Record<JenisAkun, { label: string; icon: LucideIcon }> = {
  bank: { label: "Bank", icon: Landmark },
  ewallet: { label: "E-Wallet", icon: Wallet },
  cash: { label: "Cash", icon: Banknote },
};
const JENIS_OPTIONS = (Object.keys(JENIS) as JenisAkun[]).map((value) => ({ value, label: JENIS[value].label }));

function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{children}</span>;
}

/** Item nonaktif dikelompokkan di bawah dalam bagian yang bisa dibuka (02 §6.10). */
function NonaktifGroup({ count, children }: { count: number; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <details className="group mt-4">
      <summary className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-1 text-sm font-semibold text-stone-500 ${fokus}`}>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        Nonaktif ({count})
      </summary>
      <Card className="mt-2 divide-y divide-garis overflow-hidden opacity-75">{children}</Card>
    </details>
  );
}

// ---------------- Akun ----------------

function AkunRow({ akun, isAdmin, onEdit, move }: {
  akun: Akun;
  isAdmin: boolean;
  onEdit: () => void;
  move?: { up?: () => void; down?: () => void; pending: boolean };
}) {
  const { icon: Icon, label } = JENIS[akun.jenis] ?? JENIS.bank;
  const saldo =
    akun.saldo === null ? (
      <span className="text-sm text-stone-400">—</span>
    ) : (
      <span className={`text-base font-bold tabular-nums ${akun.saldo < 0 ? "text-keluar" : ""}`}>{formatRupiah(akun.saldo)}</span>
    );
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{akun.nama}</span>
        <span className="block text-sm text-stone-500">{label}</span>
      </span>
      {saldo}
    </>
  );

  return (
    <div className="flex items-center">
      {isAdmin ? (
        <button type="button" onClick={onEdit} className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left hover:bg-brand-50 ${fokus}`}>
          {body}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">{body}</div>
      )}
      {move && (
        <div className="flex flex-col pr-2">
          <button
            type="button"
            onClick={move.up}
            disabled={!move.up || move.pending}
            aria-label={`Naikkan ${akun.nama}`}
            className={`flex h-7 w-11 items-center justify-center rounded-lg text-stone-500 hover:bg-brand-50 disabled:opacity-30 ${fokus}`}
          >
            <ChevronUp className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={move.down}
            disabled={!move.down || move.pending}
            aria-label={`Turunkan ${akun.nama}`}
            className={`flex h-7 w-11 items-center justify-center rounded-lg text-stone-500 hover:bg-brand-50 disabled:opacity-30 ${fokus}`}
          >
            <ChevronDown className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

function AkunForm({ akun, nextUrutan, onDone }: { akun: Akun | null; nextUrutan: number; onDone: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({ nama: akun?.nama ?? "", jenis: akun?.jenis ?? ("bank" as JenisAkun), aktif: akun?.aktif ?? true });

  const simpan = useMutation({
    mutationFn: async () => {
      if (!akun) return send("POST", "/akun", { nama: form.nama, jenis: form.jenis, urutan: nextUrutan });
      // Ubah aktif dulu: kalau ditolak (saldo ≠ 0), nama/jenis juga tidak berubah
      if (form.aktif !== akun.aktif) await send("PUT", `/akun/${akun.id}/aktif`, { aktif: form.aktif });
      return send("PUT", `/akun/${akun.id}`, { nama: form.nama, jenis: form.jenis, urutan: akun.urutan });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: masterKeys.akun });
      toast.show(akun ? "Akun disimpan" : "Akun ditambahkan");
      onDone();
    },
  });
  const err = simpan.error instanceof ApiError ? simpan.error : null;

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        simpan.mutate();
      }}
    >
      <Input label="Nama akun" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} error={err?.errors?.nama} autoFocus={!akun} maxLength={40} />
      <Select label="Jenis" value={form.jenis} onChange={(e) => setForm((f) => ({ ...f, jenis: e.target.value as JenisAkun }))} options={JENIS_OPTIONS} error={err?.errors?.jenis} />
      {akun && <Switch label="Aktif" checked={form.aktif} onChange={(aktif) => setForm((f) => ({ ...f, aktif }))} />}
      {akun && !form.aktif && akun.aktif && (
        <p className="-mt-2 text-xs text-stone-500">Akun hanya bisa dinonaktifkan kalau saldonya Rp 0 di semua pengguna.</p>
      )}
      <FormError error={simpan.error} />
      <Button type="submit" block loading={simpan.isPending}>
        {akun ? "Simpan" : "Tambah akun"}
      </Button>
    </form>
  );
}

function AkunTab({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useAkun(isAdmin);
  const [sheet, setSheet] = useState<{ akun: Akun | null } | null>(null);

  const urutkan = useMutation({
    mutationFn: (ids: string[]) => send("PUT", "/akun/urutan", { ids }),
    onSettled: () => qc.invalidateQueries({ queryKey: masterKeys.akun }),
    onError: (e) => toast.show(e instanceof ApiError ? e.title : "Gagal mengubah urutan.", "error"),
  });

  if (q.isPending) return <ListSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const aktif = q.data.filter((a) => a.aktif);
  const nonaktif = q.data.filter((a) => !a.aktif);
  const nextUrutan = Math.max(0, ...q.data.map((a) => a.urutan)) + 1;
  const swap = (i: number, j: number) => {
    const ids = aktif.map((a) => a.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    urutkan.mutate(ids);
  };
  const addButton = isAdmin && (
    <Button onClick={() => setSheet({ akun: null })}>
      <Plus className="size-4" aria-hidden />
      Tambah akun
    </Button>
  );

  return (
    <>
      {aktif.length === 0 ? (
        <EmptyState icon={Wallet} title={isAdmin ? "Belum ada akun. Tambahkan rekening bank, e-wallet, atau cash." : "Belum ada akun. Minta admin menambahkannya."} action={addButton} />
      ) : (
        <>
          {isAdmin && <div className="mb-3 flex justify-end">{addButton}</div>}
          <Card className="divide-y divide-garis overflow-hidden">
            {aktif.map((a, i) => (
              <AkunRow
                key={a.id}
                akun={a}
                isAdmin={isAdmin}
                onEdit={() => setSheet({ akun: a })}
                move={
                  isAdmin
                    ? { up: i > 0 ? () => swap(i, i - 1) : undefined, down: i < aktif.length - 1 ? () => swap(i, i + 1) : undefined, pending: urutkan.isPending }
                    : undefined
                }
              />
            ))}
          </Card>
          {aktif[0]?.saldo === null && <p className="mt-3 px-1 text-sm text-stone-500">Saldo tampil setelah kamu memulai periode.</p>}
        </>
      )}
      <NonaktifGroup count={nonaktif.length}>
        {nonaktif.map((a) => (
          <AkunRow key={a.id} akun={a} isAdmin={isAdmin} onEdit={() => setSheet({ akun: a })} />
        ))}
      </NonaktifGroup>

      <BottomSheet open={sheet !== null} onClose={() => setSheet(null)} title={sheet?.akun ? "Ubah akun" : "Tambah akun"}>
        {sheet && <AkunForm key={sheet.akun?.id ?? "baru"} akun={sheet.akun} nextUrutan={nextUrutan} onDone={() => setSheet(null)} />}
      </BottomSheet>
    </>
  );
}

// ---------------- Kategori ----------------

function KategoriRow({ k, isAdmin, onEdit }: { k: Kategori; isAdmin: boolean; onEdit: () => void }) {
  const body = (
    <>
      <span className="min-w-0 flex-1 truncate font-semibold">{k.nama}</span>
      {k.kodeSistem && <Badge>Sistem</Badge>}
    </>
  );
  return isAdmin ? (
    <button type="button" onClick={onEdit} className={`flex min-h-14 w-full items-center gap-3 px-4 text-left hover:bg-brand-50 ${fokus}`}>
      {body}
    </button>
  ) : (
    <div className="flex min-h-14 items-center gap-3 px-4">{body}</div>
  );
}

function KategoriForm({ kategori, tipe, onDone }: { kategori: Kategori | null; tipe: TipeKategori; onDone: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [nama, setNama] = useState(kategori?.nama ?? "");
  const [aktif, setAktif] = useState(kategori?.aktif ?? true);

  const simpan = useMutation({
    mutationFn: async () => {
      if (!kategori) return send("POST", "/kategori", { nama, tipe });
      if (aktif !== kategori.aktif) await send("PUT", `/kategori/${kategori.id}/aktif`, { aktif });
      return send("PUT", `/kategori/${kategori.id}`, { nama });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: masterKeys.kategori });
      toast.show(kategori ? "Kategori disimpan" : "Kategori ditambahkan");
      onDone();
    },
  });
  const err = simpan.error instanceof ApiError ? simpan.error : null;
  const sistem = Boolean(kategori?.kodeSistem);

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        simpan.mutate();
      }}
    >
      <Input label="Nama kategori" value={nama} onChange={(e) => setNama(e.target.value)} error={err?.errors?.nama} autoFocus={!kategori} maxLength={40} />
      <Input label="Tipe" value={tipe === "keluar" ? "Pengeluaran" : "Pemasukan"} readOnly disabled />
      {kategori && (
        <Switch
          label="Aktif"
          checked={aktif}
          onChange={setAktif}
          disabled={sistem}
          title={sistem ? "Kategori sistem tidak bisa dinonaktifkan." : undefined}
        />
      )}
      {sistem && <p className="-mt-2 text-xs text-stone-500">Kategori sistem dipakai otomatis oleh aplikasi dan tidak bisa dinonaktifkan.</p>}
      <FormError error={simpan.error} />
      <Button type="submit" block loading={simpan.isPending}>
        {kategori ? "Simpan" : "Tambah kategori"}
      </Button>
    </form>
  );
}

function KategoriTab({ isAdmin }: { isAdmin: boolean }) {
  const q = useKategori(isAdmin);
  const [tipe, setTipe] = useState<TipeKategori>("keluar");
  const [sheet, setSheet] = useState<{ kategori: Kategori | null } | null>(null);

  const list = q.data?.filter((k) => k.tipe === tipe) ?? [];
  const aktif = list.filter((k) => k.aktif);
  const nonaktif = list.filter((k) => !k.aktif);
  const addButton = isAdmin && (
    <Button onClick={() => setSheet({ kategori: null })}>
      <Plus className="size-4" aria-hidden />
      Tambah kategori
    </Button>
  );

  return (
    <>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex-1">
          <SegmentedControl
            label="Tipe kategori"
            value={tipe}
            onChange={setTipe}
            options={[
              { value: "keluar", label: "Keluar" },
              { value: "masuk", label: "Masuk" },
            ]}
          />
        </div>
        {aktif.length > 0 && addButton}
      </div>

      {q.isPending ? (
        <ListSkeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : aktif.length === 0 ? (
        <EmptyState icon={Tags} title="Belum ada kategori." action={addButton} />
      ) : (
        <Card className="divide-y divide-garis overflow-hidden">
          {aktif.map((k) => (
            <KategoriRow key={k.id} k={k} isAdmin={isAdmin} onEdit={() => setSheet({ kategori: k })} />
          ))}
        </Card>
      )}
      <NonaktifGroup count={nonaktif.length}>
        {nonaktif.map((k) => (
          <KategoriRow key={k.id} k={k} isAdmin={isAdmin} onEdit={() => setSheet({ kategori: k })} />
        ))}
      </NonaktifGroup>

      <BottomSheet open={sheet !== null} onClose={() => setSheet(null)} title={sheet?.kategori ? "Ubah kategori" : "Tambah kategori"}>
        {sheet && <KategoriForm key={sheet.kategori?.id ?? `baru-${tipe}`} kategori={sheet.kategori} tipe={sheet.kategori?.tipe ?? tipe} onDone={() => setSheet(null)} />}
      </BottomSheet>
    </>
  );
}

// ---------------- Halaman ----------------

type Tab = "akun" | "kategori";

export default function MasterPage() {
  const { data: me } = useMe();
  const isAdmin = me?.peran === "admin";
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "kategori" ? "kategori" : "akun";

  return (
    <>
      <PageHeader title="Master" />
      <div className="flex flex-col gap-4">
        <SegmentedControl
          label="Data master"
          value={tab}
          onChange={(t) => setParams(t === "akun" ? {} : { tab: t }, { replace: true })}
          options={[
            { value: "akun", label: "Akun" },
            { value: "kategori", label: "Kategori" },
          ]}
        />
        {!isAdmin && <p className="px-1 text-sm text-stone-500">Akun dan kategori dipakai bersama semua pengguna. Hanya admin yang bisa mengubahnya.</p>}
        <div>{tab === "akun" ? <AkunTab isAdmin={isAdmin} /> : <KategoriTab isAdmin={isAdmin} />}</div>
      </div>
    </>
  );
}
