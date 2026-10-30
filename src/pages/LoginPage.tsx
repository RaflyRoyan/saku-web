import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input, PasswordInput } from "../components/ui/Input";
import { Skeleton } from "../components/ui/States";
import { useAuthStatus, useMe, useSetSession, type AuthResponse } from "../hooks/useAuth";
import { ApiError, send } from "../lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const status = useAuthStatus();
  const me = useMe(status.data?.perluSetup === false);
  const setSession = useSetSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: () => send<AuthResponse>("POST", "/auth/login", { username, password }),
    meta: { ignore401: true }, // 401 di sini = password salah, bukan sesi berakhir
    onSuccess: (res) => {
      setSession(res);
      navigate(from, { replace: true });
    },
  });

  if (status.data?.perluSetup) return <Navigate to="/setup" replace />;
  if (me.data) return <Navigate to={from} replace />;
  if (status.isPending) return <Skeleton className="h-64" />;

  const err = login.error instanceof ApiError ? login.error : null;
  const pesan = login.error ? (err?.title ?? "Tidak bisa terhubung ke server.") : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    login.mutate();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <h1 className="text-xl font-bold">Masuk</h1>
      <Input
        label="Username"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        error={err?.errors?.username}
        required
      />
      <PasswordInput
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={err?.errors?.password}
        required
      />
      {pesan && !err?.errors && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-keluar">
          {pesan}
        </p>
      )}
      <Button type="submit" block loading={login.isPending} disabled={!username || !password}>
        Masuk
      </Button>
    </form>
  );
}
