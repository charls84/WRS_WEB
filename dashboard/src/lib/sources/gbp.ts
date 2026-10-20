import "server-only";
import { env, missing } from "../config";
import { googleJson, refreshTokenAccess } from "../google-auth";
import { emptyMetric, errorMessage, figure, placeholderSection, withManualBaseline } from "../metrics";
import { formatRange, parseIso, type Range } from "../periods";
import type { Metric, SourceSection, SourceStatus } from "../types";

const METRICS = {
  calls: ["CALL_CLICKS"],
  websiteClicks: ["WEBSITE_CLICKS"],
  directions: ["BUSINESS_DIRECTION_REQUESTS"],
  impressions: [
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  ],
} as const;
type Key = keyof typeof METRICS;

const LABELS: Record<Key, string> = {
  calls: "Calls from Google",
  websiteClicks: "Website clicks",
  directions: "Direction requests",
  impressions: "Profile views in Search and Maps",
};

interface Response {
  multiDailyMetricTimeSeries?: {
    dailyMetricTimeSeries?: { dailyMetric: string; timeSeries?: { datedValues?: { value?: string }[] } }[];
  }[];
}

export function gbpStatus(): SourceStatus {
  const setup = missing({
    GBP_LOCATION_ID: env.gbpLocationId,
    GOOGLE_OAUTH_CLIENT_ID: env.oauthClientId,
    GOOGLE_OAUTH_CLIENT_SECRET: env.oauthClientSecret,
    GBP_REFRESH_TOKEN: env.gbpRefreshToken,
  });
  return {
    id: "gbp",
    name: "Google Business Profile",
    state: setup.length ? "needs_approval" : "connected",
    automation: "live",
    provides: "Calls, website clicks, direction requests and how often the profile shows in Search and Maps.",
    setup: setup.length
      ? ["Request Business Profile API access from Google (approval takes days)", "Authorize once with a profile manager account", ...setup]
      : [],
    detail: "Google keeps about 18 months of profile performance data.",
  };
}

export function gbpMetrics(): Metric[] {
  const why = "Business Profile not connected";
  return (Object.keys(METRICS) as Key[]).map((k) => emptyMetric(`gbp.${k}`, LABELS[k], "count", "gbp", why));
}

function dateParams(prefix: string, iso: string): string {
  const d = parseIso(iso);
  return `${prefix}.year=${d.getUTCFullYear()}&${prefix}.month=${d.getUTCMonth() + 1}&${prefix}.day=${d.getUTCDate()}`;
}

async function sums(token: string, range: Range): Promise<Record<Key, number>> {
  const all = Object.values(METRICS).flat();
  const qs = [
    ...all.map((m) => `dailyMetrics=${m}`),
    dateParams("dailyRange.start_date", range.start),
    dateParams("dailyRange.end_date", range.end),
  ].join("&");
  const res = await googleJson<Response>(
    `https://businessprofileperformance.googleapis.com/v1/locations/${env.gbpLocationId}:fetchMultiDailyMetricsTimeSeries?${qs}`,
    token,
  );
  const byMetric = new Map<string, number>();
  for (const group of res.multiDailyMetricTimeSeries ?? []) {
    for (const s of group.dailyMetricTimeSeries ?? []) {
      const total = (s.timeSeries?.datedValues ?? []).reduce((acc, v) => acc + Number(v.value ?? 0), 0);
      byMetric.set(s.dailyMetric, (byMetric.get(s.dailyMetric) ?? 0) + total);
    }
  }
  const out = {} as Record<Key, number>;
  for (const k of Object.keys(METRICS) as Key[]) out[k] = METRICS[k].reduce((acc, m) => acc + (byMetric.get(m) ?? 0), 0);
  return out;
}

export type GbpData = { baseline: Record<Key, number> | null; current: Record<Key, number>; baselineError?: string };

export async function fetchGbp(baseline: Range, current: Range): Promise<GbpData> {
  const token = await refreshTokenAccess();
  const currentSums = await sums(token, current);
  try {
    return { baseline: await sums(token, baseline), current: currentSums };
  } catch (err) {
    // Usually a baseline older than Google's retention window.
    return { baseline: null, current: currentSums, baselineError: errorMessage(err) };
  }
}

export function buildGbpSection(data: GbpData, baseline: Range, current: Range): SourceSection {
  const b = formatRange(baseline);
  const c = formatRange(current);
  return {
    status: gbpStatus(),
    baselinePeriod: b,
    currentPeriod: c,
    metrics: (Object.keys(METRICS) as Key[]).map((k) =>
      withManualBaseline({
        key: `gbp.${k}`,
        label: LABELS[k],
        unit: "count",
        better: "up",
        source: "gbp",
        baseline: data.baseline ? figure(data.baseline[k], "api", b) : null,
        current: figure(data.current[k], "api", c),
        missing: data.baseline ? undefined : "Baseline is outside what Google returns",
      }),
    ),
  };
}

export function gbpUnavailable(err?: unknown): SourceSection {
  const status = gbpStatus();
  if (err) {
    status.state = "error";
    status.detail = errorMessage(err);
  }
  return placeholderSection(status, gbpMetrics());
}
