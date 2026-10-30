import { RefreshCw, WifiOff } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useOnline } from "../hooks/useOnline";
import { fokus } from "./ui/Button";

/** Banner "Tidak ada koneksi" dan "Versi baru tersedia" di atas semua halaman (02 M7). */
export default function StatusBanner() {
  const online = useOnline();
  const {
    needRefresh: [perluMuatUlang],
    updateServiceWorker,
  } = useRegisterSW();

  if (online && !perluMuatUlang) return null;
  return (
    <div className="sticky top-0 z-30 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {!online && (
        <p role="status" className="flex items-center justify-center gap-2 bg-stone-800 px-4 py-2 text-sm font-semibold text-white">
          <WifiOff className="size-4" aria-hidden />
          Tidak ada koneksi. Perubahan belum bisa disimpan.
        </p>
      )}
      {perluMuatUlang && (
        <div role="status" className="flex items-center justify-center gap-3 bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white">
          Versi baru tersedia
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 underline-offset-2 hover:underline ${fokus} focus-visible:ring-white focus-visible:ring-offset-brand-700`}
          >
            <RefreshCw className="size-4" aria-hidden />
            Muat ulang
          </button>
        </div>
      )}
    </div>
  );
}
