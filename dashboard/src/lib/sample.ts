import "server-only";
import { addDays } from "./periods";
import type { Check, Series, SourceSection, Table } from "./types";

/**
 * Made-up figures for building and reviewing the layout before credentials
 * exist. Only used when DASHBOARD_SAMPLE_DATA=1, and every screen says so.
 * These are NOT Weather Recovery Solutions numbers.
 */
const VALUES: Record<string, [number | null, number]> = {
  "ga4.sessions": [410, 1180],
  "ga4.users": [350, 960],
  "ga4.leads": [3, 19],
  "ga4.phoneClicks": [11, 42],
  "ga4.mapClicks": [4, 15],
  "ga4.actionRate": [0.034, 0.052],
  "gsc.impressions": [8200, 23400],
  "gsc.nonBrandedImpressions": [3100, 15800],
  "gsc.clicks": [140, 395],
  "gsc.position": [31.4, 18.2],
  "gsc.pages": [6, 14],
  "gbp.calls": [22, 37],
  "gbp.websiteClicks": [30, 58],
  "gbp.directions": [9, 14],
  "gbp.impressions": [2900, 4700],
  "reviews.count": [31, 52],
  "reviews.rating": [4.8, 4.9],
  "jobnimbus.leads": [14, 33],
  "jobnimbus.webLeads": [2, 17],
  "jobnimbus.withJob": [4, 9],
  "jobnimbus.jobRate": [0.286, 0.273],
  "pagespeed.mobile": [48, 86],
  "pagespeed.lcp": [6.1, 2.4],
  "site.indexed": [3, 9],
  "site.broken": [14, 0],
  "site.tagged": [0, 9],
};

function wave(start: string, days: number, base: number, growth: number, seed: number) {
  return Array.from({ length: days }, (_, i) => {
    const weekly = 1 + 0.18 * Math.sin((i + seed) * 0.9);
    const trend = base * (1 + (growth * i) / days);
    return { date: addDays(start, i), value: Math.max(0, Math.round(trend * weekly)) };
  });
}

export function applySample(section: SourceSection, baselinePeriod: string, currentPeriod: string, ranges: { baselineStart: string; currentStart: string; days: number }): SourceSection {
  const metrics = section.metrics.map((m) => {
    const v = VALUES[m.key];
    if (!v) return m;
    return {
      ...m,
      baseline: v[0] === null ? null : { value: v[0], origin: "sample" as const, period: baselinePeriod },
      current: { value: v[1], origin: "sample" as const, period: currentPeriod },
      missing: undefined,
    };
  });

  let series: Series[] | undefined;
  let tables: Table[] | undefined;
  let checks: Check[] | undefined;
  const { baselineStart, currentStart, days } = ranges;
  switch (section.status.id) {
    case "ga4":
      series = [{ label: "Sessions per day", current: wave(currentStart, days, 30, 0.4, 1), baseline: wave(baselineStart, days, 13, 0.05, 3) }];
      tables = [
        {
          title: "Traffic sources",
          columns: ["Channel", "Baseline", "Current"],
          rows: [
            { label: "Organic Search", baseline: 120, current: 610 },
            { label: "Direct", baseline: 190, current: 300 },
            { label: "Organic Maps", baseline: 40, current: 160 },
            { label: "Referral", baseline: 60, current: 110 },
          ],
        },
        {
          title: "Top landing pages",
          columns: ["Page", "Baseline", "Current"],
          rows: [
            { label: "/", baseline: 380, current: 720 },
            { label: "/es", baseline: 20, current: 210 },
            { label: "/pt", baseline: 10, current: 150 },
          ],
        },
      ];
      break;
    case "gsc":
      series = [{ label: "Impressions per day", current: wave(currentStart, days, 190, 0.6, 2), baseline: wave(baselineStart, days, 90, 0.05, 5) }];
      tables = [
        {
          title: "Top non-branded queries",
          columns: ["Query", "Baseline impr.", "Current impr."],
          rows: [
            { label: "roof repair deerfield beach", baseline: 210, current: 1840 },
            { label: "roofing contractor broward county", baseline: 95, current: 1210 },
            { label: "roof leak repair near me", baseline: 0, current: 960 },
            { label: "tile roof replacement", baseline: 40, current: 520 },
          ],
        },
      ];
      break;
    case "jobnimbus":
      tables = [
        {
          title: "Leads by source",
          columns: ["Source", "Baseline", "Current"],
          rows: [
            { label: "Website", baseline: 2, current: 17 },
            { label: "Referral", baseline: 7, current: 9 },
            { label: "(no source set)", baseline: 5, current: 7 },
          ],
        },
      ];
      break;
    case "reviews":
      series = [{ label: "Review count over time", current: Array.from({ length: 12 }, (_, i) => ({ date: addDays(baselineStart, i * 30), value: 31 + i * 2 })) }];
      break;
    case "site":
      checks = [
        { label: "Sitemap published", ok: true, detail: "9 URLs listed" },
        { label: "robots.txt published", ok: false, detail: "Missing" },
        { label: "Tag Manager on every page", ok: true, detail: "9 of 9 pages load the tag" },
        { label: "No broken URLs", ok: true, detail: "All sitemap URLs return 200" },
        { label: "All pages indexed by Google", ok: true, detail: "9 of 9 indexed" },
      ];
      break;
  }

  return {
    ...section,
    status: { ...section.status, state: "sample", detail: "Sample figures for layout review. Not WRS data." },
    baselinePeriod: section.baselinePeriod ?? baselinePeriod,
    currentPeriod: section.currentPeriod ?? currentPeriod,
    metrics,
    series: series ?? section.series,
    tables: tables ?? section.tables,
    checks: checks ?? section.checks,
  };
}
