import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { fokus } from "./Button";

const control =
  "min-h-11 w-full rounded-xl border bg-white px-3 text-base text-stone-900 placeholder:text-stone-400 disabled:bg-stone-50 disabled:text-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2";

interface FieldProps {
  label: string;
  error?: string[] | string;
  hint?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/** Label di atas, pesan error merah di bawah (02 §4.4). */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const pesan = Array.isArray(error) ? error[0] : error;
  const describedBy = pesan ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-stone-500">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(pesan) })}
      {pesan ? (
        <p id={`${id}-error`} className="text-sm text-keluar">
          {pesan}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-stone-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string[] | string;
  hint?: string;
}

export function Input({ label, error, hint, className = "", ...rest }: InputProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          {...rest}
          className={`${control} ${invalid ? "border-keluar" : "border-garis"} ${className}`}
        />
      )}
    </Field>
  );
}

export function PasswordInput({ label, error, hint, ...rest }: Omit<InputProps, "type">) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <input
            id={id}
            type={show ? "text" : "password"}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            {...rest}
            className={`${control} pr-12 ${invalid ? "border-keluar" : "border-garis"}`}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
            className={`absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-xl text-stone-500 ${fokus}`}
          >
            {show ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>
      )}
    </Field>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string[] | string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, ...rest }: SelectProps) {
  return (
    <Field label={label} error={error}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          {...rest}
          className={`${control} ${invalid ? "border-keluar" : "border-garis"}`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  title?: string;
}

export function Switch({ label, checked, onChange, disabled, title }: SwitchProps) {
  return (
    <label className={`flex min-h-11 items-center justify-between gap-3 ${disabled ? "opacity-60" : ""}`} title={title}>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${fokus} ${checked ? "bg-brand-700" : "bg-stone-300"}`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </label>
  );
}
