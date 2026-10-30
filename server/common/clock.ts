// Server berjalan di UTC; semua tanggal aplikasi dihitung di WIB (UTC+7).

export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Clock palsu untuk test. Bisa dimajukan dengan `advance`. */
export class FakeClock implements Clock {
  private current: number;

  constructor(start: string | Date) {
    this.current = new Date(start).getTime();
  }

  now(): Date {
    return new Date(this.current);
  }

  set(at: string | Date) {
    this.current = new Date(at).getTime();
  }

  advance(ms: number) {
    this.current += ms;
  }
}

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

/** Date yang komponen UTC-nya = jam dinding WIB. */
function shift(date: Date): Date {
  return new Date(date.getTime() + WIB_OFFSET_MS);
}

/** `yyyy-MM-dd` di WIB. */
export function toWibDate(date: Date): string {
  const d = shift(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** `yyyy-MM` di WIB. */
export function toWibMonth(date: Date): string {
  return toWibDate(date).slice(0, 7);
}

/** ISO 8601 offset WIB, mis. `2026-10-29T10:15:00+07:00`. */
export function toWibIso(date: Date): string {
  const d = shift(date);
  const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  return `${toWibDate(date)}T${time}+07:00`;
}

export const todayWib = (clock: Clock) => toWibDate(clock.now());
export const nowWibIso = (clock: Clock) => toWibIso(clock.now());
