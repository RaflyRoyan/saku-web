import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input, PasswordInput } from "../components/ui/Input";
import { ErrorState, Skeleton } from "../components/ui/States";
import { useAuthStatus, useSetSession, type AuthResponse } from "../hooks/useAuth";
import { ApiError, send } from "../lib/api";

export default function SetupPage() {
  const navigate = useNavigate();
  const status = useAuthStatus();
  const setSession = useSetSession();
  const [form, setForm] = useState({ nama: "", username: "", password: "", ulangi: "" });
  const [ulangiError, setUlangiError] = useState<string>();

  const setup = useMutation({
    mutationFn: () =>
      send<AuthResponse>("POST", "/auth/setup", { nama: form.nama, username: form.username, password: form.password }),
    onSuccess: (res) => {
      setSession(res);
      navigate("/", { replace: true });
    },
  });

  if (status.isPending) return <Skeleton className="h-96" />;
  if (status.isError) return <ErrorState error={status.error} onRetry={() => status.refetch()} />;
  if (!status.data.perluSetup) return <Navigate to="/login" replace />;

  const err = setup.error instanceof ApiError ? setup.error : null;
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.ulangi) {
      setUlangiError("Password tidak sama.");
      return;
    }
    setUlangiError(undefined);
    setup.mutate();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div>
        <h1 className="text-xl font-bold">Buat akun admin</h1>
        <p className="text-sm text-stone-500">Akun pertama menjadi admin dan bisa menambah pengguna lain.</p>
      </div>
      <Input label="Nama" autoComplete="name" value={form.nama} onChange={set("nama")} error={err?.errors?.nama} required />
      <Input
        label="Username"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        value={form.username}
        onChange={set("username")}
        error={err?.errors?.username}
        hint="3–30 karakter: huruf kecil, angka, titik, atau garis bawah."
        required
      />
      <PasswordInput
        label="Password"
        autoComplete="new-password"
        value={form.password}
        onChange={set("password")}
        error={err?.errors?.password}
        hint="Minimal 8 karakter, berisi huruf dan angka."
        required
      />
      <PasswordInput
        label="Ulangi Password"
        autoComplete="new-password"
        value={form.ulangi}
        onChange={set("ulangi")}
        error={ulangiError}
        required
      />
      {err && !err.errors && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-keluar">
          {err.title}
        </p>
      )}
      <Button type="submit" block loading={setup.isPending}>
        Buat & Masuk
      </Button>
    </form>
  );
}
