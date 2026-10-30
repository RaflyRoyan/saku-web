import type { ReactNode } from "react";
import { fokus } from "./Button";

interface ChipPickerProps<T extends string> {
  label: string;
  value: T | null;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  onChange: (value: T) => void;
  error?: string[] | string;
  /** Satu baris dengan scroll horizontal (pilihan akun), atau membungkus (kategori). */
  scroll?: boolean;
  footer?: ReactNode;
}

/** Grid chip untuk pilih cepat, bukan dropdown panjang (AkunPicker, KategoriPicker, 02 §4.4). */
export function ChipPicker<T extends string>({ label, value, options, onChange, error, scroll, footer }: ChipPickerProps<T>) {
  const pesan = Array.isArray(error) ? error[0] : error;
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-stone-500">{label}</legend>
      <div className={`flex gap-2 ${scroll ? "-mx-4 overflow-x-auto px-4 pb-1" : "flex-wrap"}`}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              disabled={o.disabled}
              onClick={() => onChange(o.value)}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-40 ${fokus} ${
                active ? "border-brand-700 bg-brand-50 text-brand-700" : "border-garis bg-white text-stone-700 hover:bg-brand-50"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {pesan ? <p className="text-sm text-keluar">{pesan}</p> : footer}
    </fieldset>
  );
}
