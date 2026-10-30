import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

export const fokus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2";

const VARIANT = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 disabled:bg-brand-700/60",
  secondary: "border border-garis bg-white text-stone-900 hover:bg-brand-50 disabled:text-stone-400",
  ghost: "text-brand-700 hover:bg-brand-50 disabled:text-stone-400",
  danger: "text-keluar hover:bg-rose-50 disabled:text-stone-400",
  dangerSolid: "bg-keluar text-white hover:bg-rose-800 disabled:bg-keluar/60",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANT;
  loading?: boolean;
  block?: boolean;
}

export function Button({ variant = "primary", loading, block, disabled, className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${fokus} ${VARIANT[variant]} ${block ? "w-full" : ""} ${className}`}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
