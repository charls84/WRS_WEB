import "server-only";
import { baselineConfig, env, GSC_RETENTION_DAYS, missing } from "../config";
import { googleJson, serviceAccountToken } from "../google-auth";
import { emptyMetric, errorMessage, figure, placeholderSection, withManualBaseline } from "../metrics";
import { daysBetween, formatRange, todayIso, type Range } from "../periods";
import type { Metric, SourceSection, SourceStatus } from "../types";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

interface Row {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
interface QueryResponse {
  rows?: Row[];
}

export function gscStatus(): SourceStatus {
  const setup = missing({ GSC_SITE_URL: env.gscSiteUrl, GOOGLE_SERVICE_ACCOUNT_JSON: env.googleServiceAccount });
  return {
    id: "gsc",
    name: "Google Search Console",
    state: setup.length ? "not_configured" : "connected",
    automation: "live",
    provides: "Impressions, clicks, non-branded reach, service queries, average position and pages that appear in Google.",
    setup: setup.length ? [...setup, "Add the service account email as a user on the Search Console property"] : [],
    detail: "Google keeps 16 months of Search Console data. Older baselines must be entered by hand.",
  };
}

export function gscMetrics(): Metric[] {
  const why = "Search Console not connected";
  return [
    emptyMetric("gsc.impressions", "Impressions", "count", "gsc", why),
    emptyMetric("gsc.nonBrandedImpressions", "Non-branded impressions", "count", "gsc", why),
    emptyMetric("gsc.clicks", "Clicks", "count", "gsc", why),
    emptyMetric("gsc.position", "Average position", "position", "gsc", why, "down"),
    emptyMetric("gsc.pages", "Pages with impressions", "count", "gsc", why),
  ];
}

/** Matches queries that contain the business name, so the rest are people who did not already know WRS. */
function brandRegex(): string {
  return baselineConfig.brandTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
}

async function query(token: string, range: Range, body: Record<string, unknown>): Promise<Row[]> {
  const site = encodeURIComponent(env.gscSiteUrl as string);
  const res = await googleJson<QueryResponse>(
    `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`,
    token,
    { startDate: range.start, endDate: range.end, dataState: "final", ...body },
  );
  return res.rows ?? [];
}

const nonBranded = () => ({
  dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "excludingRegex", expression: `(?i)(${brandRegex()})` }] }],
});

async function periodData(token: string, range: Range) {
  const [totals, nb, pages, queries, daily] = await Promise.all([
    query(token, range, {}),
    query(token, range, nonBranded()),
    query(token, range, { dimensions: ["page"], rowLimit: 25000 }),
    query(token, range, { dimensions: ["query"], rowLimit: 15, ...nonBranded() }),
    query(token, range, { dimensions: ["date"], rowLimit: 500 }),
  ]);
  return { totals: totals[0] ?? null, nonBranded: nb[0] ?? null, pageCount: pages.filter((p) => p.impressions > 0).length, queries, daily };
}

export type GscData = { baseline: Awaited<ReturnType<typeof periodData>> | null; current: Awaited<ReturnType<typeof periodData>> };

export async function fetchGsc(baseline: Range, current: Range): Promise<GscData> {
  const token = await serviceAccountToken([SCOPE]);
  const reachable = daysBetween(baseline.start, todayIso()) < GSC_RETENTION_DAYS;
  const [b, c] = await Promise.all([reachable ? periodData(token, baseline) : Promise.resolve(null), periodData(token, current)]);
  return { baseline: b, current: c };
}

export function buildGscSection(data: GscData, baseline: Range, current: Range): SourceSection {
  const b = formatRange(baseline);
  const c = formatRange(current);
  const tooOld = data.baseline === null;
  const make = (
    key: string,
    label: string,
    unit: Metric["unit"],
    get: (d: NonNullable<GscData["baseline"]>) => number | null,
    better: Metric["better"] = "up",
  ): Metric =>
    withManualBaseline({
      key,
      label,
      unit,
      better,
      source: "gsc",
      baseline: data.baseline ? figure(get(data.baseline), "api", b) : null,
      current: figure(get(data.current), "api", c),
      missing: tooOld ? "Baseline is older than the 16 months Search Console keeps" : undefined,
    });

  const metrics = [
    make("gsc.impressions", "Impressions", "count", (d) => d.totals?.impressions ?? 0),
    make("gsc.nonBrandedImpressions", "Non-branded impressions", "count", (d) => d.nonBranded?.impressions ?? 0),
    make("gsc.clicks", "Clicks", "count", (d) => d.totals?.clicks ?? 0),
    make("gsc.position", "Average position", "position", (d) => d.totals?.position ?? null, "down"),
    make("gsc.pages", "Pages with impressions", "count", (d) => d.pageCount),
  ];

  const baseQueries = new Map((data.baseline?.queries ?? []).map((r) => [r.keys?.[0] ?? "", r.impressions]));
  return {
    status: gscStatus(),
    baselinePeriod: b,
    currentPeriod: c,
    metrics,
    series: [
      {
        label: "Impressions per day",
        current: data.current.daily.map((r) => ({ date: r.keys?.[0] ?? "", value: r.impressions })),
        baseline: data.baseline?.daily.map((r) => ({ date: r.keys?.[0] ?? "", value: r.impressions })),
      },
    ],
    tables: [
      {
        title: "Top non-branded queries",
        columns: ["Query", "Baseline impr.", "Current impr."],
        rows: data.current.queries.slice(0, 10).map((r) => ({
          label: r.keys?.[0] ?? "",
          baseline: data.baseline ? (baseQueries.get(r.keys?.[0] ?? "") ?? 0) : null,
          current: r.impressions,
        })),
        note: "Google hides rare queries for privacy, so query totals are lower than overall impressions.",
      },
    ],
  };
}

export function gscUnavailable(err?: unknown): SourceSection {
  const status = gscStatus();
  if (err) {
    status.state = "error";
    status.detail = errorMessage(err);
  }
  return placeholderSection(status, gscMetrics());
}
