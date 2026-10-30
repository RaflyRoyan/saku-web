import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, Users } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button, fokus } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FormError } from "../components/ui/FormError";
import { Input, PasswordInput, Select, Switch } from "../components/ui/Input";
import { EmptyState, ErrorState, ListSkeleton } from "../components/ui/States";
import { useMe, type Pengguna } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { ApiError, api, send } from "../lib/api";
import { formatWaktu } from "../lib/format";

const KEY = ["pengguna"] as const;
const PERAN = [
  { value: "user", label: "Pengguna" },
  { value: "admin", label: "Admin" },
];

function Badge({ children, tone }: { children: React.ReactNode; tone: "brand" | "stone" }) {
  const cls = tone === "brand" ? "bg-brand-50 text-brand-700" : "bg-stone-100 text-stone-500";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}

function TambahForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({ nama: "", username: "", password: "", peran: "user" });
  const tambah = useMutation({
    mutationFn: () => send<Pengguna>("POST", "/pengguna", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.show("Pengguna ditambahkan");
      onDone();
    },
  });
  const err = tambah.error instanceof ApiError ? tambah.error : null;
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        tambah.mutate();
      }}
    >
      <Input label="Nama" value={form.nama} onChange={set("nama")} error={err?.errors?.nama} autoFocus />
      <Input
        label="Username"
        autoCapitalize="none"
        autoCorrect="off"
        value={form.username}
        onChange={set("username")}
        error={err?.errors?.username}
        hint="3–30 karakter: huruf kecil, angka, titik, atau garis bawah."
      />
      <PasswordInput
        label="Password awal"
        autoComplete="new-password"
        value={form.password}
        onChange={set("password")}
        error={err?.errors?.password}
        hint="Minimal 8 karakter, berisi huruf dan angka."
      />
      <Select label="Peran" value={form.peran} onChange={set("peran")} options={PERAN} error={err?.errors?.peran} />
      <FormError error={tambah.error} />
      <Button type="submit" block loading={tambah.isPending}>
        Tambah pengguna
      </Button>
    </form>
  );
}

function UbahForm({ target, isSelf, onDone }: { target: Pengguna; isSelf: boolean; onDone: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({ nama: target.nama, peran: target.peran as string, aktif: target.aktif });
  const [reset, setReset] = useState("");
  const [showReset, setShowReset] = useState(false);

  const ubah = useMutation({
    mutationFn: () => send<Pengguna>("PUT", `/pengguna/${target.id}`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.show("Pengguna disimpan");
      onDone();
    },
  });
  const resetPw = useMutation({
    mutationFn: () => send("POST", `/pengguna/${target.id}/reset-password`, { passwordBaru: reset }),
    onSuccess: () => {
      toast.show(`Password ${target.nama} direset`);
      onDone();
    },
  });
  const err = ubah.error instanceof ApiError ? ubah.error : null;
  const resetErr = resetPw.error instanceof ApiError ? resetPw.error : null;

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          ubah.mutate();
        }}
      >
        <Input label="Nama" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} error={err?.errors?.nama} />
        <Input label="Username" value={target.username} readOnly disabled />
        <Select label="Peran" value={form.peran} onChange={(e) => setForm((f) => ({ ...f, peran: e.target.value }))} options={PERAN} />
        <Switch
          label="Aktif"
          checked={form.aktif}
          onChange={(aktif) => setForm((f) => ({ ...f, aktif }))}
          disabled={isSelf}
          title={isSelf ? "Anda tidak bisa menonaktifkan akun sendiri." : undefined}
        />
        {isSelf && <p className="-mt-2 text-xs text-stone-500">Anda tidak bisa menonaktifkan akun sendiri.</p>}
        <FormError error={ubah.error} />
        <Button type="submit" block loading={ubah.isPending}>
          Simpan
        </Button>
      </form>

      <div className="flex flex-col gap-3 border-t border-garis pt-4">
        {showReset ? (
          <form
            className="flex flex-col gap-3"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              resetPw.mutate();
            }}
          >
            <PasswordInput
              label="Password baru"
              autoComplete="new-password"
              value={reset}
              onChange={(e) => setReset(e.target.value)}
              error={resetErr?.errors?.passwordBaru}
              hint="Semua sesi pengguna ini akan berakhir."
              autoFocus
            />
            <FormError error={resetPw.error} />
            <Button type="submit" variant="secondary" loading={resetPw.isPending} disabled={!reset}>
              Reset password
            </Button>
          </form>
        ) : (
          <Button variant="ghost" onClick={() => setShowReset(true)} className="self-start">
            <KeyRound className="size-4" aria-hidden />
            Reset password
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PenggunaPage() {
  const { data: me } = useMe();
  const list = useQuery({ queryKey: KEY, queryFn: () => api<Pengguna[]>("/pengguna") });
  const [tambah, setTambah] = useState(false);
  const [edit, setEdit] = useState<Pengguna | null>(null);

  const addButton = (
    <Button onClick={() => setTambah(true)}>
      <Plus className="size-4" aria-hidden />
      Tambah pengguna
    </Button>
  );

  return (
    <>
      <PageHeader title="Kelola Pengguna" action={list.data?.length ? addButton : undefined} />

      {list.isPending ? (
        <ListSkeleton />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : list.data.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada pengguna." action={addButton} />
      ) : (
        <Card className="divide-y divide-garis overflow-hidden">
          {list.data.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setEdit(p)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-50 ${fokus}`}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                {p.nama.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className={`truncate font-semibold ${p.aktif ? "" : "text-stone-400"}`}>{p.nama}</span>
                  {p.peran === "admin" && <Badge tone="brand">Admin</Badge>}
                  {!p.aktif && <Badge tone="stone">Nonaktif</Badge>}
                  {p.id === me?.id && <Badge tone="stone">Anda</Badge>}
                </span>
                <span className="block truncate text-sm text-stone-500">
                  @{p.username} · {p.lastLogin ? `login ${formatWaktu(p.lastLogin)}` : "belum pernah login"}
                </span>
              </span>
            </button>
          ))}
        </Card>
      )}

      <BottomSheet open={tambah} onClose={() => setTambah(false)} title="Tambah pengguna">
        {tambah && <TambahForm onDone={() => setTambah(false)} />}
      </BottomSheet>
      <BottomSheet open={edit !== null} onClose={() => setEdit(null)} title="Ubah pengguna">
        {edit && <UbahForm key={edit.id} target={edit} isSelf={edit.id === me?.id} onDone={() => setEdit(null)} />}
      </BottomSheet>
    </>
  );
}
