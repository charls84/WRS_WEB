import "server-only";
import { get, put } from "@vercel/blob";
import { env } from "./config";

/**
 * Daily history for sources that only report "right now" (review count,
 * PageSpeed, site crawl). A cron job appends one entry per day so the
 * dashboard can show growth from the first snapshot onward.
 */
export interface Snapshot {
  date: string; // YYYY-MM-DD
  reviews?: { count: number; rating: number | null };
  pagespeed?: { score: number; lcp: number | null; cls: number | null };
  site?: { urls: number; broken: number; tagged: number; indexed: number | null };
}

const PATH = "wrs-dashboard/snapshots.json";

export function snapshotsEnabled(): boolean {
  return Boolean(env.blobToken);
}

export async function readSnapshots(): Promise<Snapshot[]> {
  if (!snapshotsEnabled()) return [];
  try {
    const result = await get(PATH, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return [];
    const data = (await new Response(result.stream).json()) as Snapshot[];
    return Array.isArray(data) ? data.sort((a, b) => a.date.localeCompare(b.date)) : [];
  } catch {
    return [];
  }
}

/** Replaces today's entry if the cron runs twice. */
export async function saveSnapshot(entry: Snapshot): Promise<number> {
  const all = (await readSnapshots()).filter((s) => s.date !== entry.date);
  all.push(entry);
  all.sort((a, b) => a.date.localeCompare(b.date));
  await put(PATH, JSON.stringify(all), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return all.length;
}

export function firstWith<K extends keyof Snapshot>(snapshots: Snapshot[], key: K): (Snapshot & Required<Pick<Snapshot, K>>) | null {
  return (snapshots.find((s) => s[key] !== undefined) as (Snapshot & Required<Pick<Snapshot, K>>) | undefined) ?? null;
}
