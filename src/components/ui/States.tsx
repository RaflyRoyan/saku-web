import type { ReactNode } from "react";
import { CircleAlert, type LucideIcon } from "lucide-react";
import { ApiError } from "../../lib/api";
import { Button } from "./Button";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-brand-100/70 ${className}`} />;
}

/** Beberapa baris skeleton untuk list. */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Memuat" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="size-7" aria-hidden />
      </span>
      <p className="text-sm text-stone-500">{title}</p>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const pesan = error instanceof ApiError ? error.title : "Tidak bisa terhubung ke server.";
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-keluar">
        <CircleAlert className="size-7" aria-hidden />
      </span>
      <p className="text-sm text-stone-700">{pesan}</p>
      <Button variant="secondary" onClick={onRetry}>
        Coba lagi
      </Button>
    </div>
  );
}
