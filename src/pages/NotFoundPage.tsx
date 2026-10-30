import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-bold">Halaman tidak ditemukan</h1>
      <Link to="/" className="font-semibold text-brand-700">
        Kembali ke Beranda
      </Link>
    </main>
  );
}
