import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Langit fajar dengan sudut bawah melengkung (02 §6.1) */}
      <header className="bg-sunrise flex flex-col items-center gap-2 rounded-b-[2.5rem] px-4 pt-14 pb-12 text-center text-white shadow-lg shadow-orange-900/15">
        <img src="/logo.svg" alt="" className="size-16 rounded-2xl shadow-md ring-2 ring-white/40" />
        <p className="text-3xl font-extrabold tracking-tight">Saku</p>
        <p className="text-sm text-white/85">Catat uang, pantau per akun</p>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
