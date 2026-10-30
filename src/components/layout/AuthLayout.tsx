import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-sunrise px-4 pt-12 pb-10 text-white">
        <p className="text-2xl font-extrabold tracking-tight">Saku</p>
        <p className="text-sm text-white/80">Pencatatan keuangan pribadi</p>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
