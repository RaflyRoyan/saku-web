import { useState } from "react";
import { Link } from "react-router-dom";
import { ArcElement, Chart as ChartJS, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { PerKategori } from "../../hooks/usePeriode";
import { formatRupiah, formatRupiahRingkas } from "../../lib/format";
import { fokus } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";

ChartJS.register(ArcElement, Tooltip);

type Tampilan = "donut" | "bar";
const INGAT = "saku.dashboard.kategori";

function tampilanAwal(): Tampilan {
  try {
    return localStorage.getItem(INGAT) === "bar" ? "bar" : "donut";
  } catch {
    return "donut";
  }
}

// Slot kategorikal berurutan (divalidasi: CVD & normal-vision lulus di permukaan putih).
// Kontras < 3:1 untuk beberapa slot → nama, nominal, dan persen selalu tampil sebagai teks.
const WARNA = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];
const LAINNYA = "#a8a29e";

/**
 * Pengeluaran per kategori: maks 5 teratas + "Lainnya" (02 §6.2). Bisa ditampilkan sebagai donut atau
 * bar tersegmentasi (pilihan diingat per browser); legenda berisi nama, nominal, dan persen. Tap kategori → Riwayat terfilter.
 */
export function KomposisiKategori({ items, periodeId }: { items: PerKategori[]; periodeId: string }) {
  const [tampilan, setTampilan] = useState<Tampilan>(tampilanAwal);
  const total = items.reduce((n, k) => n + k.total, 0);
  if (total <= 0) return <p className="text-sm text-stone-500">Belum ada pengeluaran di periode ini.</p>;

  const top = items.slice(0, 5).map((k, i) => ({ ...k, warna: WARNA[i] }));
  const sisa = items.slice(5);
  const bagian: (PerKategori & { warna: string; lainnya?: boolean })[] = sisa.length
    ? [...top, { kategoriId: "", nama: "Lainnya", total: sisa.reduce((n, k) => n + k.total, 0), jumlah: sisa.reduce((n, k) => n + k.jumlah, 0), warna: LAINNYA, lainnya: true }]
    : top;
  const persen = (n: number) => Math.round((n / total) * 100);
  const ringkas = bagian.map((b) => `${b.nama} ${persen(b.total)}%`).join(", ");

  return (
    <div className="flex flex-col gap-3">
      <div className="self-end">
        <SegmentedControl
          label="Tampilan grafik"
          value={tampilan}
          options={[
            { value: "donut", label: "Donut" },
            { value: "bar", label: "Bar" },
          ]}
          onChange={(v) => {
            setTampilan(v);
            try {
              localStorage.setItem(INGAT, v);
            } catch {
              // localStorage tidak tersedia: pilihan hanya berlaku sampai halaman ditutup
            }
          }}
        />
      </div>
      {tampilan === "donut" ? (
        <div className="relative mx-auto size-48" role="img" aria-label={ringkas}>
          <Doughnut
            data={{
              labels: bagian.map((b) => b.nama),
              datasets: [{ data: bagian.map((b) => b.total), backgroundColor: bagian.map((b) => b.warna), borderColor: "#ffffff", borderWidth: 2, hoverOffset: 4 }],
            }}
            options={{
              cutout: "68%",
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => ` ${formatRupiah(ctx.parsed)} · ${persen(ctx.parsed)}%` } },
              },
            }}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-stone-500">Total</span>
            <span className="font-bold tabular-nums">{formatRupiahRingkas(total)}</span>
          </div>
        </div>
      ) : (
        <div className="flex h-4 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={ringkas}>
          {bagian.map((b) => (
            <span key={b.nama} title={`${b.nama} · ${formatRupiah(b.total)} · ${persen(b.total)}%`} style={{ flexGrow: b.total, backgroundColor: b.warna }} className="min-w-1 first:rounded-l-full last:rounded-r-full" />
          ))}
        </div>
      )}
      <ul className="flex flex-col">
        {bagian.map((b) => {
          const isi = (
            <>
              <span aria-hidden className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: b.warna }} />
              <span className="min-w-0 flex-1 truncate font-medium text-stone-700">{b.nama}</span>
              <span className="tabular-nums text-stone-900">{formatRupiah(b.total)}</span>
              <span className="w-10 text-right text-sm tabular-nums text-stone-500">{persen(b.total)}%</span>
            </>
          );
          const cls = "flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm";
          return (
            <li key={b.nama}>
              {b.lainnya ? (
                <div className={cls}>{isi}</div>
              ) : (
                <Link to={`/riwayat?periode=${periodeId}&kategoriId=${b.kategoriId}`} className={`${cls} hover:bg-brand-50 ${fokus}`}>
                  {isi}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
