// Thin fetch wrapper around the backend API — attaches the JWT and normalises errors.
const API_BASE = "/api/v1";

const TOKEN_KEY = "hsms_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Login writes the token; logout and failed /auth/me clear it.
export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Every request sends JSON accept headers; logged-in calls also send Bearer token.
function authHeaders() {
  const headers = { Accept: "application/json" };
  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  // Non-2xx responses become thrown errors with the server's message when available.
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data;
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data;
}

export async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data;
}

export async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data;
}

/** Best-effort server logout (JWT is stateless; client must clear the token). */
export async function signOutRemote() {
  try {
    await apiPost("/auth/logout", {});
  } catch {
    /* ignore */
  }
}
