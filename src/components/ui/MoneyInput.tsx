import type { InputHTMLAttributes, Ref } from "react";
import { formatAngka } from "../../lib/format";
import { Field } from "./Input";

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  error?: string[] | string;
  hint?: string;
  /** Tampilan besar di tengah untuk nominal utama form transaksi. */
  besar?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** `inputMode="numeric"`, titik ribuan saat mengetik, nilai disimpan sebagai angka (02 §4.4). */
export function MoneyInput({ label, value, onChange, error, hint, besar, ref, className = "", ...rest }: MoneyInputProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid }) => (
        <div
          className={`flex items-center gap-2 rounded-xl border bg-white px-3 focus-within:ring-2 focus-within:ring-brand-400 focus-within:ring-offset-2 ${
            invalid ? "border-keluar" : "border-garis"
          } ${besar ? "min-h-16 justify-center" : "min-h-11"}`}
        >
          <span className={`font-semibold text-stone-400 ${besar ? "text-2xl" : "text-base"}`}>Rp</span>
          <input
            ref={ref}
            id={id}
            inputMode="numeric"
            autoComplete="off"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            placeholder="0"
            {...rest}
            value={value === null ? "" : formatAngka(value)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
              onChange(digits === "" ? null : Number(digits));
            }}
            className={`min-w-0 bg-transparent text-stone-900 placeholder:text-stone-300 focus:outline-none ${
              besar ? "w-full max-w-64 text-3xl font-extrabold tabular-nums" : "w-full text-base tabular-nums"
            } ${className}`}
          />
        </div>
      )}
    </Field>
  );
}
