/**
 * Quick health (and optional login) check against a running API — useful after deploy or in CI.
 *
 * Usage:
 *   SMOKE_BASE_URL=http://127.0.0.1:5001 node src/scripts/smoke-test.js
 * Optional login check:
 *   SMOKE_EMAIL=… SMOKE_PASSWORD=… node src/scripts/smoke-test.js
 */

const base = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:5001").replace(/\/$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS) || 8000;

async function fetchJson(path, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = text;
    }
    return { res, body };
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const health = await fetchJson("/api/v1/health");
  if (!health.res.ok) {
    throw new Error(`GET /api/v1/health failed: ${health.res.status}`);
  }

  const email = process.env.SMOKE_EMAIL;
  const password = process.env.SMOKE_PASSWORD;
  if (email && password) {
    const login = await fetchJson("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!login.res.ok) {
      throw new Error(`POST /auth/login failed: ${login.res.status} ${JSON.stringify(login.body)}`);
    }
    const token = login.body?.token;
    if (!token) throw new Error("Login response missing token");
    const me = await fetchJson("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!me.res.ok) {
      throw new Error(`GET /auth/me failed: ${me.res.status}`);
    }
  }

  console.log(`smoke ok (${base})`);
}

main().catch((err) => {
  console.error("[smoke-test]", err.message || err);
  process.exit(1);
});
