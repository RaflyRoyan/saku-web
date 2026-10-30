import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export type JenisAkun = "bank" | "ewallet" | "cash";
export type TipeKategori = "masuk" | "keluar";

export interface Akun {
  id: string;
  nama: string;
  jenis: JenisAkun;
  urutan: number;
  aktif: boolean;
  /** Saldo milik pengguna yang login di periode aktif; null kalau belum ada periode. */
  saldo: number | null;
}

export interface Kategori {
  id: string;
  nama: string;
  tipe: TipeKategori;
  kodeSistem: "BIAYA_ADMIN" | "TARIK_TABUNGAN" | null;
  aktif: boolean;
}

export const masterKeys = {
  akun: ["akun"] as const,
  kategori: ["kategori"] as const,
};

export function useAkun(termasukNonaktif = false) {
  return useQuery({
    queryKey: [...masterKeys.akun, { termasukNonaktif }],
    queryFn: () => api<Akun[]>(`/akun?termasukNonaktif=${termasukNonaktif}`),
  });
}

export function useKategori(termasukNonaktif = false) {
  return useQuery({
    queryKey: [...masterKeys.kategori, { termasukNonaktif }],
    queryFn: () => api<Kategori[]>(`/kategori?termasukNonaktif=${termasukNonaktif}`),
  });
}
