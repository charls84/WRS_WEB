import { type NextRequest } from "next/server";
import { collectSnapshot } from "@/lib/dashboard";
import { saveSnapshot, snapshotsEnabled } from "@/lib/snapshots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Vercel Cron calls this daily (vercel.json) with Authorization: Bearer $CRON_SECRET.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!snapshotsEnabled()) {
    return Response.json({ ok: false, error: "BLOB_READ_WRITE_TOKEN is not set" }, { status: 500 });
  }
  const { errors, ...entry } = await collectSnapshot();
  const total = await saveSnapshot(entry);
  return Response.json({ ok: true, date: entry.date, saved: Object.keys(entry).filter((k) => k !== "date"), errors, total });
}
