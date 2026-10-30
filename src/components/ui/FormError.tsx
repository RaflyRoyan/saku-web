import { ApiError } from "../../lib/api";

/** Pesan error umum form. Error per field (ProblemDetails `errors`) sudah tampil di bawah input. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  const err = error instanceof ApiError ? error : null;
  if (err?.errors) return null;
  return (
    <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-keluar">
      {err?.title ?? "Tidak bisa terhubung ke server."}
    </p>
  );
}
