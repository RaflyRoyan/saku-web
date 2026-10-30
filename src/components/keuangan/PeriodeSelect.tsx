import { usePeriodeList } from "../../hooks/usePeriode";
import { formatTanggal } from "../../lib/format";
import { fokus } from "../ui/Button";

/** Pilih periode (default aktif) untuk melihat periode lama (02 §6.4). */
export function PeriodeSelect({ value, onChange }: { value: string | undefined; onChange: (id: string) => void }) {
  const list = usePeriodeList();
  if (!list.data?.length) return null;
  return (
    <select
      aria-label="Periode"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={`min-h-10 max-w-48 truncate rounded-xl border border-garis bg-white px-2 text-sm font-semibold ${fokus}`}
    >
      {list.data.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nama}
          {p.tanggalSelesai ? ` (s.d. ${formatTanggal(p.tanggalSelesai)})` : ""}
        </option>
      ))}
    </select>
  );
}
