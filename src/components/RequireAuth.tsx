import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStatus, useMe } from "../hooks/useAuth";
import { ApiError } from "../lib/api";
import { Skeleton } from "./ui/States";
import { ErrorState } from "./ui/States";

function FullPageSkeleton() {
  return (
    <div role="status" aria-label="Memuat" className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-36" />
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
    </div>
  );
}

/** Belum setup → /setup. Belum login → /login. `adminOnly` → bukan admin kembali ke beranda. */
export default function RequireAuth({ adminOnly = false }: { adminOnly?: boolean }) {
  const location = useLocation();
  const status = useAuthStatus();
  const perluSetup = status.data?.perluSetup;
  const me = useMe(perluSetup === false);

  if (status.isPending) return <FullPageSkeleton />;
  if (status.isError) return <ErrorState error={status.error} onRetry={() => status.refetch()} />;
  if (perluSetup) return <Navigate to="/setup" replace />;

  if (me.isPending) return <FullPageSkeleton />;
  if (me.isError) {
    if (me.error instanceof ApiError && me.error.status === 401) {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return <ErrorState error={me.error} onRetry={() => me.refetch()} />;
  }
  if (adminOnly && me.data.peran !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
}
