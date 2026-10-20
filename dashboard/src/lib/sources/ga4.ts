import "server-only";
import { env, missing } from "../config";
import { googleJson, serviceAccountToken } from "../google-auth";
import { emptyMetric, errorMessage, figure, placeholderSection, safeDivide, withManualBaseline } from "../metrics";
import { formatRange, type Range } from "../periods";
import type { Metric, SeriesPoint, SourceSection, SourceStatus, Table } from "../types";

/** Events the WRS site pushes to the dataLayer (src/components/AnalyticsListener.tsx, PageSections.client.tsx). */
const LEAD_EVENT = "generate_lead";
const PHONE_EVENT = "phone_click";
const MAP_EVENT = "map_click";
const EVENTS = [LEAD_EVENT, PHONE_EVENT, MAP_EVENT];

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

interface Row {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
}
interface Report {
  dimensionHeaders?: { name: string }[];
  rows?: Row[];
}

type Bucket = "baseline" | "current";

function bucketOf(report: Report, row: Row): Bucket {
  const dims = row.dimensionValues ?? [];
  const idx = report.dimensionHeaders?.findIndex((h) => h.name === "dateRange") ?? -1;
  const v = dims[idx >= 0 ? idx : dims.length - 1]?.value;
  return v === "baseline" ? "baseline" : "current";
}

function num(row: Row, i = 0): number {
  return Number(row.metricValues?.[i]?.value ?? 0);
}

export function ga4Status(): SourceStatus {
  const setup = missing({ GA4_PROPERTY_ID: env.ga4PropertyId, GOOGLE_SERVICE_ACCOUNT_JSON: env.googleServiceAccount });
  return {
    id: "ga4",
    name: "Google Analytics 4",
    state: setup.length ? "not_configured" : "connected",
    automation: "live",
    provides: "Users, sessions, form leads, phone clicks, landing pages and traffic sources.",
    setup: setup.length ? [...setup, "Add the service account email as Viewer on the GA4 property"] : [],
  };
}

export function ga4Metrics(): Metric[] {
  const why = "GA4 not connected";
  return [
    emptyMetric("ga4.sessions", "Sessions", "count", "ga4", why),
    emptyMetric("ga4.users", "Users", "count", "ga4", why),
    emptyMetric("ga4.leads", "Form leads", "count", "ga4", why),
    emptyMetric("ga4.phoneClicks", "Phone clicks", "count", "ga4", why),
    emptyMetric("ga4.mapClicks", "Direction clicks", "count", "ga4", why),
    emptyMetric("ga4.actionRate", "Visits that act", "percent", "ga4", why),
  ];
}

export async function fetchGa4(baseline: Range, current: Range): Promise<{ reports: Report[] }> {
  const token = await serviceAccountToken([SCOPE]);
  const dateRanges = [
    { startDate: baseline.start, endDate: baseline.end, name: "baseline" },
    { startDate: current.start, endDate: current.end, name: "current" },
  ];
  const sessionsDesc = [{ metric: { metricName: "sessions" }, desc: true }];
  return googleJson<{ reports: Report[] }>(
    `https://analyticsdata.googleapis.com/v1beta/properties/${env.ga4PropertyId}:batchRunReports`,
    token,
    {
      requests: [
        { dateRanges, metrics: [{ name: "totalUsers" }, { name: "sessions" }] },
        {
          dateRanges,
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: EVENTS } } },
        },
        { dateRanges, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: sessionsDesc, limit: 30 },
        { dateRanges, dimensions: [{ name: "landingPage" }], metrics: [{ name: "sessions" }], orderBys: sessionsDesc, limit: 60 },
        { dateRanges, dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }], limit: 400 },
      ],
    },
  );
}

function pairTable(report: Report, title: string, first: string, top: number): Table {
  const map = new Map<string, { baseline: number; current: number }>();
  for (const row of report.rows ?? []) {
    const label = row.dimensionValues?.[0]?.value || "(not set)";
    const entry = map.get(label) ?? { baseline: 0, current: 0 };
    entry[bucketOf(report, row)] += num(row);
    map.set(label, entry);
  }
  const rows = [...map.entries()]
    .sort((a, b) => b[1].current - a[1].current)
    .slice(0, top)
    .map(([label, v]) => ({ label, baseline: v.baseline, current: v.current }));
  return { title, columns: [first, "Baseline", "Current"], rows };
}

export function buildGa4Section(data: { reports: Report[] }, baseline: Range, current: Range): SourceSection {
  const [totals, events, channels, landing, daily] = data.reports;
  const b = formatRange(baseline);
  const c = formatRange(current);

  const sums = { baseline: { users: 0, sessions: 0 }, current: { users: 0, sessions: 0 } };
  for (const row of totals.rows ?? []) {
    const k = bucketOf(totals, row);
    sums[k].users += num(row, 0);
    sums[k].sessions += num(row, 1);
  }
  const ev = { baseline: {} as Record<string, number>, current: {} as Record<string, number> };
  for (const row of events.rows ?? []) {
    const name = row.dimensionValues?.[0]?.value ?? "";
    const k = bucketOf(events, row);
    ev[k][name] = (ev[k][name] ?? 0) + num(row);
  }

  // Zero sessions in the baseline means GA4 was not collecting yet, not that nobody visited.
  const hasBaseline = sums.baseline.sessions > 0;
  const noBaseline = "GA4 has no data for this period (tracking may not have existed yet)";
  const pick = (k: Bucket, v: number | null, period: string) => (k === "baseline" && !hasBaseline ? null : figure(v, "api", period));

  const make = (key: string, label: string, unit: Metric["unit"], get: (k: Bucket) => number | null): Metric =>
    withManualBaseline({
      key,
      label,
      unit,
      better: "up",
      source: "ga4",
      baseline: pick("baseline", get("baseline"), b),
      current: pick("current", get("current"), c),
      missing: hasBaseline ? undefined : noBaseline,
    });

  const actions = (k: Bucket) => (ev[k][LEAD_EVENT] ?? 0) + (ev[k][PHONE_EVENT] ?? 0);
  const metrics = [
    make("ga4.sessions", "Sessions", "count", (k) => sums[k].sessions),
    make("ga4.users", "Users", "count", (k) => sums[k].users),
    make("ga4.leads", "Form leads", "count", (k) => ev[k][LEAD_EVENT] ?? 0),
    make("ga4.phoneClicks", "Phone clicks", "count", (k) => ev[k][PHONE_EVENT] ?? 0),
    make("ga4.mapClicks", "Direction clicks", "count", (k) => ev[k][MAP_EVENT] ?? 0),
    make("ga4.actionRate", "Visits that act", "percent", (k) => safeDivide(actions(k), sums[k].sessions)),
  ];

  const series: Record<Bucket, SeriesPoint[]> = { baseline: [], current: [] };
  for (const row of daily.rows ?? []) {
    const raw = row.dimensionValues?.[0]?.value ?? "";
    series[bucketOf(daily, row)].push({ date: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`, value: num(row) });
  }
  series.baseline.sort((x, y) => x.date.localeCompare(y.date));
  series.current.sort((x, y) => x.date.localeCompare(y.date));

  return {
    status: ga4Status(),
    baselinePeriod: b,
    currentPeriod: c,
    metrics,
    series: [{ label: "Sessions per day", current: series.current, baseline: hasBaseline ? series.baseline : undefined }],
    tables: [pairTable(channels, "Traffic sources", "Channel", 8), pairTable(landing, "Top landing pages", "Page", 8)],
  };
}

export function ga4Unavailable(err?: unknown): SourceSection {
  const status = ga4Status();
  if (err) {
    status.state = "error";
    status.detail = errorMessage(err);
  }
  return placeholderSection(status, ga4Metrics());
}
