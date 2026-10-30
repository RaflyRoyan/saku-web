import { Link } from "react-router-dom";
import { CalendarPlus } from "lucide-react";
import { Card } from "../ui/Card";
import { fokus } from "../ui/Button";

/** Belum ada periode: ajak mulai periode pertama (02 §6.2, §6.7). */
export function PeriodeKosong() {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <CalendarPlus className="size-7" aria-hidden />
      </span>
      <h2 className="text-lg font-bold">Mulai periode pertama</h2>
      <p className="max-w-sm text-sm text-stone-500">
        Satu periode biasanya dari gajian ke gajian. Isi gaji yang diterima sebagai saldo awal akun, lalu catat transaksi.
      </p>
      <Link
        to="/periode/baru"
        className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 ${fokus}`}
      >
        Mulai periode pertama
      </Link>
    </Card>
  );
}
