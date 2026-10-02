import { API_BASE } from "./api";

/**
 * Admin API client: JWT stored in localStorage, attached to every admin call.
 */

const TOKEN_KEY = "wowspice.admin.token";

export function adminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function adminLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid email or password.");
  const data = (await res.json()) as { token: string };
  return data.token;
}

/** Authenticated fetch. On 401 it clears the token and bounces to /admin/login. */
export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = adminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token ?? ""}`,
    },
  });
  if (res.status === 401) {
    clearAdminToken();
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new Error("Session expired.");
  }
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}
