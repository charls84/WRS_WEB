import "server-only";
import { createSign } from "node:crypto";
import { env } from "./config";

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

const TOKEN_URL = "https://oauth2.googleapis.com/token";

function readServiceAccount(): ServiceAccount {
  const raw = env.googleServiceAccount;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  // Accept raw JSON or base64 (base64 survives env var editors that mangle newlines).
  const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  const sa = JSON.parse(text) as ServiceAccount;
  if (!sa.client_email || !sa.private_key) throw new Error("Service account JSON is missing client_email or private_key");
  return sa;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

const tokenCache = new Map<string, { token: string; exp: number }>();

/** Access token for the service account (GA4, Search Console). */
export async function serviceAccountToken(scopes: string[]): Promise<string> {
  const key = scopes.join(" ");
  const hit = tokenCache.get(key);
  if (hit && hit.exp > Date.now() + 60_000) return hit.token;

  const sa = readServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: sa.client_email, scope: key, aud: sa.token_uri ?? TOKEN_URL, iat: now, exp: now + 3600 }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const assertion = `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`;

  const res = await fetch(sa.token_uri ?? TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google token request failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache.set(key, { token: data.access_token, exp: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}

/** Access token from a stored OAuth refresh token (Business Profile, which does not accept service accounts). */
export async function refreshTokenAccess(): Promise<string> {
  const { oauthClientId, oauthClientSecret, gbpRefreshToken } = env;
  if (!oauthClientId || !oauthClientSecret || !gbpRefreshToken) throw new Error("Business Profile OAuth is not configured");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: oauthClientId,
      client_secret: oauthClientSecret,
      refresh_token: gbpRefreshToken,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`OAuth refresh failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

export async function googleJson<T>(url: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text.slice(0, 300);
    try {
      message = (JSON.parse(text) as { error?: { message?: string } }).error?.message ?? message;
    } catch {}
    const err = new Error(`${res.status}: ${message}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}
