import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLACES_BASE = "https://places.googleapis.com/v1/places";
const BLOB_PATH = "reviews/latest.json";

interface PlaceDetails {
  userRatingCount?: number;
  rating?: number;
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const placeId = process.env.GOOGLE_PLACES_ID;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!placeId || !apiKey) {
    return Response.json(
      { ok: false, error: "missing_places_config" },
      { status: 500 },
    );
  }

  const placesRes = await fetch(
    `${PLACES_BASE}/${placeId}?fields=userRatingCount,rating`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!placesRes.ok) {
    const body = await placesRes.text();
    return Response.json(
      {
        ok: false,
        error: "places_failed",
        status: placesRes.status,
        body: body.slice(0, 200),
      },
      { status: 502 },
    );
  }

  const data = (await placesRes.json()) as PlaceDetails;
  const count = typeof data.userRatingCount === "number" ? data.userRatingCount : 0;
  const rating = typeof data.rating === "number" ? data.rating : null;

  const payload = {
    count,
    rating,
    updatedAt: new Date().toISOString(),
  };

  try {
    await put(BLOB_PATH, JSON.stringify(payload), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: "blob_write_failed",
        message: err instanceof Error ? err.message : String(err),
        count,
        rating,
      },
      { status: 502 },
    );
  }

  revalidatePath("/[locale]", "layout");

  return Response.json({ ok: true, count, rating });
}
