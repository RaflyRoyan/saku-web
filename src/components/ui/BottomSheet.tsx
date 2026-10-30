import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { fokus } from "./Button";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Panel dari bawah di HP, modal di tengah di laptop. Memakai `<dialog>` untuk fokus & tombol Esc. */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // klik di luar panel
      }}
      aria-labelledby="sheet-title"
      className="m-0 mt-auto w-full max-w-none rounded-t-2xl bg-white p-0 text-stone-900 backdrop:bg-stone-900/40 lg:m-auto lg:max-w-md lg:rounded-2xl"
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="flex items-center justify-between border-b border-garis px-4 py-2">
            <h2 id="sheet-title" className="text-base font-bold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className={`flex size-11 items-center justify-center rounded-xl text-stone-500 hover:bg-brand-50 ${fokus}`}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="overflow-y-auto px-4 py-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
