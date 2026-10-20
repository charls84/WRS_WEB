import "server-only";
import { env, SITE_URL } from "../config";
import { emptyMetric, errorMessage, figure, manualOrSnapshot, placeholderSection } from "../metrics";
import { formatDate, todayIso } from "../periods";
import { firstWith, type Snapshot } from "../snapshots";
import type { Metric, SourceSection, SourceStatus } from "../types";

export interface PageSpeedData {
  score: number; // 0–100
  lcp: number | null; // seconds, lab
  cls: number | null;
  fieldLcp: number | null; // seconds, real Chrome users (CrUX), when Google has enough traffic
}

export function pagespeedStatus(): SourceStatus {
  return {
    id: "pagespeed",
    name: "PageSpeed Insights",
    state: "connected",
    automation: "snapshot",
    provides: "Mobile performance score and load time for the home page, saved daily.",
    setup: env.pagespeedApiKey ? [] : ["PAGESPEED_API_KEY (the keyless quota is shared and often used up)"],
    detail: "Lab scores move a few points between runs. Read the trend, not one run.",
  };
}

export function pagespeedMetrics(): Metric[] {
  const why = "PageSpeed run failed";
  return [
    emptyMetric("pagespeed.mobile", "Mobile performance", "score", "pagespeed", why),
    emptyMetric("pagespeed.lcp", "Mobile load time (LCP)", "seconds", "pagespeed", why, "down"),
  ];
}

export async function fetchPageSpeed(url = SITE_URL): Promise<PageSpeedData> {
  const qs = new URLSearchParams({ url, strategy: "mobile", category: "performance" });
  if (env.pagespeedApiKey) qs.set("key", env.pagespeedApiKey);
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`PageSpeed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as {
    lighthouseResult?: {
      categories?: { performance?: { score?: number } };
      audits?: Record<string, { numericValue?: number }>;
    };
    loadingExperience?: { metrics?: Record<string, { percentile?: number }> };
  };
  const audits = data.lighthouseResult?.audits ?? {};
  const fieldLcp = data.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile;
  return {
    score: Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100),
    lcp: audits["largest-contentful-paint"]?.numericValue != null ? audits["largest-contentful-paint"].numericValue / 1000 : null,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
    fieldLcp: fieldLcp != null ? fieldLcp / 1000 : null,
  };
}

export function buildPageSpeedSection(now: PageSpeedData, snapshots: Snapshot[]): SourceSection {
  const first = firstWith(snapshots, "pagespeed");
  const firstPeriod = first ? `First snapshot, ${formatDate(first.date)}` : "";
  const today = `Today, ${formatDate(todayIso())}`;
  const base = (v: number | null | undefined) => (first ? figure(v, "snapshot", firstPeriod) : null);
  const metrics: Metric[] = [
    manualOrSnapshot(
      {
        key: "pagespeed.mobile",
        label: "Mobile performance",
        unit: "score",
        better: "up",
        source: "pagespeed",
        baseline: null,
        current: figure(now.score, "api", today),
        missing: "No baseline yet: first daily snapshot pending",
      },
      base(first?.pagespeed.score),
    ),
    manualOrSnapshot(
      {
        key: "pagespeed.lcp",
        label: "Mobile load time (LCP)",
        unit: "seconds",
        better: "down",
        source: "pagespeed",
        baseline: null,
        current: figure(now.lcp, "api", today),
        missing: "No baseline yet: first daily snapshot pending",
      },
      base(first?.pagespeed.lcp),
    ),
  ];
  if (now.fieldLcp != null) {
    metrics.push({
      key: "pagespeed.fieldLcp",
      label: "Load time, real visitors",
      unit: "seconds",
      better: "down",
      source: "pagespeed",
      baseline: null,
      current: figure(now.fieldLcp, "api", "Last 28 days, Chrome users"),
      missing: "Google reports this only for the last 28 days",
    });
  }
  const history = snapshots.filter((s) => s.pagespeed).map((s) => ({ date: s.date, value: s.pagespeed!.score }));
  return {
    status: pagespeedStatus(),
    metrics,
    series: history.length > 1 ? [{ label: "Mobile score over time", current: history }] : undefined,
  };
}

export function pagespeedUnavailable(err?: unknown): SourceSection {
  const status = pagespeedStatus();
  if (err) {
    status.state = "error";
    status.detail = errorMessage(err);
  }
  return placeholderSection(status, pagespeedMetrics());
}
