const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const MIN_SCORE = 0.5;

export type RecaptchaResult =
  | { ok: true; score: number; bypassed?: boolean }
  | { ok: false; reason: "missing_token" | "low_score" | "verify_failed" | "wrong_action"; score?: number };

interface SiteVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export async function verifyRecaptcha(token: string | undefined, expectedAction: string): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    console.warn("[recaptcha] RECAPTCHA_SECRET_KEY not set — bypassing verification (dev mode)");
    return { ok: true, score: 1, bypassed: true };
  }

  if (!token) {
    return { ok: false, reason: "missing_token" };
  }

  const body = new URLSearchParams({ secret, response: token });

  let data: SiteVerifyResponse;
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    data = (await res.json()) as SiteVerifyResponse;
  } catch (err) {
    console.error("[recaptcha] siteverify request failed", err);
    return { ok: false, reason: "verify_failed" };
  }

  if (!data.success) {
    console.warn("[recaptcha] verification rejected", data["error-codes"]);
    return { ok: false, reason: "verify_failed" };
  }

  if (data.action && data.action !== expectedAction) {
    return { ok: false, reason: "wrong_action", score: data.score };
  }

  const score = data.score ?? 0;
  if (score < MIN_SCORE) {
    return { ok: false, reason: "low_score", score };
  }

  return { ok: true, score };
}
