import { createContext, useContext } from "react";

export type ToastKind = "sukses" | "error" | "peringatan";

export const ToastContext = createContext<{ show: (message: string, kind?: ToastKind) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam ToastProvider.");
  return ctx;
}
