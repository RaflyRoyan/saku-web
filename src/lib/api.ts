export class ApiError extends Error {
  // Field ditulis eksplisit (bukan parameter property) karena tsconfig memakai erasableSyntaxOnly
  status: number;
  title: string;
  errors?: Record<string, string[]>;

  constructor(status: number, title: string, errors?: Record<string, string[]>) {
    super(title);
    this.status = status;
    this.title = title;
    this.errors = errors;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "saku",
      ...init.headers,
    },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.title ?? "Terjadi kesalahan.", body.errors);
  return body as T;
}

/** POST/PUT/DELETE dengan body JSON. */
export function send<T>(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
}
