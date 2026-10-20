import { GSC_RETENTION_DAYS } from "./config";

export interface Range {
  start: string; // YYYY-MM-DD, inclusive
  end: string; // YYYY-MM-DD, inclusive
}

const DAY = 86_400_000;

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseIso(s: string): Date {
  return new Date(`${s}T00:00:00Z`);
}

export function addDays(s: string, n: number): string {
  return iso(new Date(parseIso(s).getTime() + n * DAY));
}

export function todayIso(now = new Date()): string {
  return iso(now);
}

/** Last `days` complete days, ending `lagDays` before today (sources report with a delay). */
export function currentRange(days: number, lagDays: number, now = new Date()): Range {
  const end = addDays(todayIso(now), -lagDays);
  return { start: addDays(end, -(days - 1)), end };
}

/**
 * The baseline window has the same length as the current one so the
 * comparison is like for like. Without a configured start we fall back to
 * the oldest period Search Console still holds, and say so in the UI.
 */
export function baselineRange(
  days: number,
  configuredStart: string | null,
  now = new Date(),
): Range & { fallback: boolean } {
  if (configuredStart && /^\d{4}-\d{2}-\d{2}$/.test(configuredStart)) {
    return { start: configuredStart, end: addDays(configuredStart, days - 1), fallback: false };
  }
  const start = addDays(todayIso(now), -(GSC_RETENTION_DAYS - 7));
  return { start, end: addDays(start, days - 1), fallback: true };
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseIso(b).getTime() - parseIso(a).getTime()) / DAY);
}

export function unixSeconds(s: string, endOfDay = false): number {
  return Math.floor(parseIso(s).getTime() / 1000) + (endOfDay ? 86_399 : 0);
}

const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const fmtNoYear = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function formatRange(r: Range): string {
  const a = parseIso(r.start);
  const b = parseIso(r.end);
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  return `${sameYear ? fmtNoYear.format(a) : fmt.format(a)} – ${fmt.format(b)}`;
}

export function formatDate(s: string): string {
  return fmt.format(parseIso(s));
}
