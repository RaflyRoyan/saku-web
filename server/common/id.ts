import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567"; // base32 huruf kecil, 32 karakter

function randomPart(length = 8): string {
  const bytes = randomBytes(length);
  let s = "";
  // 32 membagi 256, jadi `& 31` tidak bias
  for (const b of bytes) s += ALPHABET[b & 31];
  return s;
}

/** ID `{prefix}-{8 karakter a-z2-7}`, mis. `TR-k3f9x2ab`. `isTaken` dipakai untuk cek tabrakan. */
export function generateId(prefix: string, isTaken: (id: string) => boolean = () => false): string {
  for (let i = 0; i < 10; i++) {
    const id = `${prefix}-${randomPart()}`;
    if (!isTaken(id)) return id;
  }
  throw new Error(`Gagal membuat ID unik untuk prefix ${prefix}.`);
}
