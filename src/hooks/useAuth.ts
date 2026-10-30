import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, send } from "../lib/api";

export interface Pengguna {
  id: string;
  username: string;
  nama: string;
  peran: "admin" | "user";
  aktif: boolean;
  lastLogin: string | null;
}

export interface AuthResponse {
  pengguna: Pengguna;
  expiresAt: string;
}

export const authKeys = {
  status: ["auth", "status"] as const,
  me: ["auth", "me"] as const,
};

export function useAuthStatus() {
  return useQuery({
    queryKey: authKeys.status,
    queryFn: () => api<{ perluSetup: boolean }>("/auth/status"),
    staleTime: Infinity,
  });
}

/** Pengguna yang login. 401 = belum login (bukan "sesi berakhir"), jadi tidak memicu toast. */
export function useMe(enabled = true) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => api<Pengguna>("/auth/me"),
    enabled,
    meta: { ignore401: true },
    staleTime: 5 * 60_000,
  });
}

/** Setelah login/setup: simpan pengguna ke cache supaya guard langsung lolos. */
export function useSetSession() {
  const qc = useQueryClient();
  return (res: AuthResponse) => {
    qc.setQueryData(authKeys.status, { perluSetup: false });
    qc.setQueryData(authKeys.me, res.pengguna);
  };
}

export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => send<void>("POST", "/auth/logout"),
    meta: { ignore401: true },
    onSettled: () => {
      qc.clear();
      navigate("/login", { replace: true });
    },
  });
}
