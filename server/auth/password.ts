import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

export const DEFAULT_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

/** Format: `pbkdf2-sha256$<iterasi>$<salt base64>$<hash base64>` (spec §6.2). */
export async function hashPassword(password: string, iterations = DEFAULT_ITERATIONS): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await pbkdf2Async(password, salt, iterations, HASH_BYTES, "sha256");
  return `pbkdf2-sha256$${iterations}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, iter, saltB64, hashB64] = stored.split("$");
  const iterations = Number(iter);
  if (algo !== "pbkdf2-sha256" || !Number.isInteger(iterations) || iterations <= 0 || !saltB64 || !hashB64) {
    return false;
  }
  const expected = Buffer.from(hashB64, "base64");
  const actual = await pbkdf2Async(password, Buffer.from(saltB64, "base64"), iterations, expected.length, "sha256");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Minimal 8 karakter, mengandung huruf dan angka. Mengembalikan pesan error atau null. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Password minimal 8 karakter.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "Password harus mengandung huruf dan angka.";
  return null;
}
