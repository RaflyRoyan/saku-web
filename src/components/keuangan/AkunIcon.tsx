import { Landmark, Smartphone, Wallet } from "lucide-react";

const ICON = { bank: Landmark, ewallet: Smartphone, cash: Wallet } as const;

/** Ikon per jenis akun (02 §6.4). */
export function AkunIcon({ jenis, className = "size-5" }: { jenis: string; className?: string }) {
  const Icon = ICON[jenis as keyof typeof ICON] ?? Wallet;
  return <Icon className={className} aria-hidden />;
}
