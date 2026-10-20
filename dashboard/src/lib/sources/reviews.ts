import "server-only";
import { env, missing } from "../config";
import { emptyMetric, errorMessage, figure, manualOrSnapshot, placeholderSection } from "../metrics";
import { formatDate, todayIso } from "../periods";
import { firstWith, snapshotsEnabled, type Snapshot } from "../snapshots";
import type { Metric, SourceSection, SourceStatus } from "../types";

export interface PlaceData {
  count: number;
  rating: number | null;
}

export function reviewsStatus(): SourceStatus {
  const setup = missing({ GOOGLE_PLACES_API_KEY: env.placesApiKey, GOOGLE_PLACES_ID: env.placesId });
  if (!snapshotsEnabled()) setup.push("BLOB_READ_WRITE_TOKEN (keeps the daily review history)");
  return {
    id: "reviews",
    name: "Google reviews",
    state: missing({ a: env.placesApiKey, b: env.placesId }).length ? "not_configured" : "connected",
    automation: "snapshot",
    provides: "Review count and star rating, saved once a day to show review growth.",
    setup,
    detail: "Google returns only today's totals. Growth starts from the first daily snapshot or a number entered by hand.",
  };
}

export function reviewsMetrics(): Metric[] {
  const why = "Places API not connected";
  return [
    emptyMetric("reviews.count", "Google reviews", "count", "reviews", why),
    emptyMetric("reviews.rating", "Star rating", "rating", "reviews", why),
  ];
}

/** Same call the WRS site already makes in /api/reviews/refresh. */
export async function fetchPlace(): Promise<PlaceData> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${env.placesId}?fields=userRatingCount,rating`, {
    headers: { "X-Goog-Api-Key": env.placesApiKey as string },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Places API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { userRatingCount?: number; rating?: number };
  return { count: data.userRatingCount ?? 0, rating: data.rating ?? null };
}

export function buildReviewsSection(place: PlaceData, snapshots: Snapshot[]): SourceSection {
  const first = firstWith(snapshots, "reviews");
  const firstPeriod = first ? `First snapshot, ${formatDate(first.date)}` : "";
  const today = `Today, ${formatDate(todayIso())}`;
  const snap = (v: number | null | undefined) => (first ? figure(v, "snapshot", firstPeriod) : null);
  const make = (key: string, label: string, unit: Metric["unit"], now: number | null, then: number | null | undefined): Metric =>
    manualOrSnapshot(
      {
        key,
        label,
        unit,
        better: "up",
        source: "reviews",
        baseline: null,
        current: figure(now, "api", today),
        missing: "No baseline yet: add the pre-DXW count to data/baseline.json",
      },
      snap(then),
    );

  const metrics = [
    make("reviews.count", "Google reviews", "count", place.count, first?.reviews.count),
    make("reviews.rating", "Star rating", "rating", place.rating, first?.reviews.rating),
  ];

  const history = snapshots.filter((s) => s.reviews).map((s) => ({ date: s.date, value: s.reviews!.count }));
  return {
    status: reviewsStatus(),
    metrics,
    series: history.length > 1 ? [{ label: "Review count over time", current: history }] : undefined,
  };
}

export function reviewsUnavailable(err?: unknown): SourceSection {
  const status = reviewsStatus();
  if (err) {
    status.state = "error";
    status.detail = errorMessage(err);
  }
  return placeholderSection(status, reviewsMetrics());
}
