import { ApiError } from "./api";

// Respons 401 di mana pun → App membersihkan cache dan kembali ke /login (02 M2).

type Listener = () => void;
const listeners = new Set<Listener>();

export function onSessionExpired(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** `meta.ignore401` dipakai query/mutation yang 401-nya bagian dari alur normal (cek sesi, login). */
export function handleApiError(err: unknown, meta?: Record<string, unknown>) {
  if (err instanceof ApiError && err.status === 401 && !meta?.ignore401) {
    for (const fn of listeners) fn();
  }
}
