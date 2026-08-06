import "server-only";
import { cache } from "react";
import { get } from "@vercel/blob";
import { MIN_REVIEW_COUNT } from "./reviews";

const BLOB_PATH = "reviews/latest.json";

interface ReviewsBlob {
  count?: number;
  rating?: number | null;
  updatedAt?: string;
}

export interface Reviews {
  count: number;
  rating: number | null;
}

export const getReviews = cache(async (): Promise<Reviews> => {
  try {
    const result = await get(BLOB_PATH, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) {
      return { count: MIN_REVIEW_COUNT, rating: null };
    }

    const data = (await new Response(result.stream).json()) as ReviewsBlob;
    const rawCount =
      typeof data.count === "number" && Number.isFinite(data.count)
        ? Math.trunc(data.count)
        : MIN_REVIEW_COUNT;
    const rating =
      typeof data.rating === "number" && Number.isFinite(data.rating)
        ? data.rating
        : null;
    return {
      count: Math.max(rawCount, MIN_REVIEW_COUNT),
      rating,
    };
  } catch {
    // Blob store unavailable (local dev, misconfigured) — use the floor.
  }
  return { count: MIN_REVIEW_COUNT, rating: null };
});
