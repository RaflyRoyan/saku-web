import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, CircleCheck, LogOut } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, PasswordInput } from "../components/ui/Input";
import { Skeleton } from "../components/ui/States";
import { authKeys, useLogout, useMe, type Pengguna } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { ApiError, api, send } from "../lib/api";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-bold text-stone-500">{title}</h2>
      <Card className="flex flex-col gap-4 p-4">{children}</Card>
    </section>
  );
}

function ProfilForm({ me }: { me: Pengguna }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [nama, setNama] = useState(me.nama);
  const simpan = useMutation({
    mutationFn: () => send<Pengguna>("PUT", "/auth/profil", { nama }),
    onSuccess: (res) => {
      qc.setQueryData(authKeys.me, res);
      toast.show("Profil disimpan");
    },
  });
  const err = simpan.error instanceof ApiError ? simpan.error : null;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        simpan.mutate();
      }}
    >
      <Input label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} error={err?.errors?.nama ?? (err && !err.errors ? err.title : undefined)} />
      <Input label="Username" value={me.username} readOnly disabled />
      <Input label="Peran" value={me.peran === "admin" ? "Admin" : "Pengguna"} readOnly disabled />
      <Button type="submit" loading={simpan.isPending} disabled={nama.trim() === me.nama} className="self-start">
        Simpan profil
      </Button>
    </form>
  );
}

function PasswordForm() {
  const toast = useToast();
  const empty = { passwordLama: "", passwordBaru: "", ulangi: "" };
  const [form, setForm] = useState(empty);
  const [ulangiError, setUlangiError] = useState<string>();
  const ganti = useMutation({
    mutationFn: () => send("PUT", "/auth/password", { passwordLama: form.passwordLama, passwordBaru: form.passwordBaru }),
    onSuccess: () => {
      setForm(empty);
      toast.show("Password diganti");
    },
  });
  const err = ganti.error instanceof ApiError ? ganti.error : null;
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (form.passwordBaru !== form.ulangi) {
      setUlangiError("Password baru tidak sama.");
      return;
    }
    setUlangiError(undefined);
    ganti.mutate();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <PasswordInput label="Password lama" autoComplete="current-password" value={form.passwordLama} onChange={set("passwordLama")} error={err?.errors?.passwordLama} />
      <PasswordInput
        label="Password baru"
        autoComplete="new-password"
        value={form.passwordBaru}
        onChange={set("passwordBaru")}
        error={err?.errors?.passwordBaru}
        hint="Minimal 8 karakter, berisi huruf dan angka."
      />
      <PasswordInput label="Ulangi password baru" autoComplete="new-password" value={form.ulangi} onChange={set("ulangi")} error={ulangiError} />
      {err && !err.errors && <p role="alert" className="text-sm text-keluar">{err.title}</p>}
      <Button
        type="submit"
        loading={ganti.isPending}
        disabled={!form.passwordLama || !form.passwordBaru || !form.ulangi}
        className="self-start"
      >
        Ganti password
      </Button>
    </form>
  );
}

function StatusSheets() {
  const q = useQuery({
    queryKey: ["health", "sheets"],
    queryFn: () => api<{ ok: boolean }>("/health/sheets"),
    retry: false,
  });
  if (q.isPending) return <Skeleton className="h-5 w-48" />;
  return q.isSuccess ? (
    <p className="flex items-center gap-2 text-sm text-masuk">
      <CircleCheck className="size-4" aria-hidden /> Terhubung ke Google Sheets
    </p>
  ) : (
    <p className="flex items-center gap-2 text-sm text-keluar">
      <CircleAlert className="size-4" aria-hidden />
      {q.error instanceof ApiError ? q.error.title : "Tidak bisa terhubung ke server."}
    </p>
  );
}

export default function PengaturanPage() {
  const { data: me } = useMe();
  const logout = useLogout();

  return (
    <>
      <PageHeader title="Pengaturan" />
      <div className="flex flex-col gap-6">
        <Section title="Profil">{me ? <ProfilForm me={me} /> : <Skeleton className="h-40" />}</Section>
        <Section title="Ganti password">
          <PasswordForm />
        </Section>
        <Section title="Info">
          <p className="text-sm text-stone-700">Saku v{__APP_VERSION__}</p>
          <StatusSheets />
        </Section>
        <Button variant="danger" onClick={() => logout.mutate()} loading={logout.isPending} className="self-start">
          <LogOut className="size-5" aria-hidden />
          Keluar
        </Button>
      </div>
    </>
  );
}
