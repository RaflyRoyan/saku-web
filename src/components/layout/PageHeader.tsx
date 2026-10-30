import type { ReactNode } from "react";

/** Judul halaman: sticky putih di HP, biasa di laptop (02 §5). */
export default function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 -mx-4 mb-4 flex min-h-14 items-center justify-between gap-3 border-b border-garis bg-white px-4 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
      <h1 className="text-xl font-bold">{title}</h1>
      {action}
    </header>
  );
}
