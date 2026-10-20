import "server-only";
import { unstable_cache } from "next/cache";
import { baselineConfig, baselineStart, env, sampleMode, type WindowDays } from "./config";
import { baselineRange, currentRange, daysBetween, formatRange, todayIso, type Range } from "./periods";
import { applySample } from "./sample";
import { readSnapshots } from "./snapshots";
import { buildGa4Section, fetchGa4, ga4Status, ga4Unavailable } from "./sources/ga4";
import { buildGbpSection, fetchGbp, gbpStatus, gbpUnavailable } from "./sources/gbp";
import { buildGscSection, fetchGsc, gscStatus, gscUnavailable } from "./sources/gsc";
import { buildJobNimbusSection, fetchJobNimbus, jobnimbusStatus, jobnimbusUnavailable } from "./sources/jobnimbus";
import { buildPageSpeedSection, fetchPageSpeed, pagespeedUnavailable } from "./sources/pagespeed";
import { buildReviewsSection, fetchPlace, reviewsStatus, reviewsUnavailable } from "./sources/reviews";
import { buildSiteSection, runSiteAudit, siteUnavailable } from "./sources/site";
import type { AreaId, AreaRow, Dashboard, Metric, SourceId, SourceSection } from "./types";

const SIX_HOURS = 6 * 3600;
const DAY = 24 * 3600;

/** Reporting delay per source, in days. */
const LAG = { ga4: 1, gsc: 3, gbp: 5, jobnimbus: 0 };

// Cached fetchers. A throw is not cached, so a failed source retries on the next load.
const cachedGa4 = unstable_cache(fetchGa4, ["ga4"], { revalidate: SIX_HOURS });
const cachedGsc = unstable_cache(fetchGsc, ["gsc"], { revalidate: SIX_HOURS });
const cachedGbp = unstable_cache(fetchGbp, ["gbp"], { revalidate: SIX_HOURS });
const cachedJn = unstable_cache(fetchJobNimbus, ["jobnimbus"], { revalidate: SIX_HOURS });
const cachedPlace = unstable_cache(fetchPlace, ["places"], { revalidate: SIX_HOURS });
const cachedPsi = unstable_cache(() => fetchPageSpeed(), ["pagespeed"], { revalidate: DAY });
const cachedSite = unstable_cache(runSiteAudit, ["site-audit"], { revalidate: DAY });

async function guard(fn: () => Promise<SourceSection>, fallback: (err: unknown) => SourceSection): Promise<SourceSection> {
  try {
    return await fn();
  } catch (err) {
    console.error("[dashboard] source failed", err);
    return fallback(err);
  }
}

const AREA_METRICS: Record<AreaId, string[]> = {
  search: ["gsc.nonBrandedImpressions", "gsc.clicks"],
  website: ["ga4.actionRate", "pagespeed.mobile"],
  leads: ["ga4.leads", "ga4.phoneClicks"],
  reputation: ["reviews.count", "reviews.rating"],
  measurement: [],
  followup: ["jobnimbus.leads", "jobnimbus.jobRate"],
};

function measurementSummary(sections: Record<SourceId, SourceSection>): string {
  const ga4Leads = sections.ga4.metrics.find((m) => m.key === "ga4.leads")?.current?.value ?? 0;
  const tagged = sections.site.checks?.find((c) => c.label.startsWith("Tag Manager"))?.ok === true;
  const checks = [
    sections.ga4.status.state === "connected" || sections.ga4.status.state === "sample",
    ga4Leads > 0,
    tagged,
    sections.gsc.status.state === "connected" || sections.gsc.status.state === "sample",
    sections.jobnimbus.status.state === "connected" || sections.jobnimbus.status.state === "sample",
  ];
  return `${checks.filter(Boolean).length} of ${checks.length} measurement checks pass`;
}

function buildAreas(sections: Record<SourceId, SourceSection>): AreaRow[] {
  const all = new Map<string, Metric>();
  for (const s of Object.values(sections)) for (const m of s.metrics) all.set(m.key, m);
  return (Object.keys(AREA_METRICS) as AreaId[]).map((id) => {
    const text = baselineConfig.areas[id];
    return {
      id,
      area: text.area,
      changed: text.changed,
      meaning: text.meaning,
      beforeText: text.before,
      currentText: text.current ?? (id === "measurement" ? measurementSummary(sections) : null),
      metrics: AREA_METRICS[id].map((k) => all.get(k)).filter((m): m is Metric => Boolean(m)),
    };
  });
}

export async function getDashboard(days: WindowDays): Promise<Dashboard> {
  const today = todayIso();
  const base = baselineRange(days, baselineStart());
  const baseRange: Range = { start: base.start, end: base.end };
  const cur = (lag: number) => currentRange(days, lag);
  const sample = sampleMode();

  const snapshots = sample ? [] : await readSnapshots();

  const live = (configured: boolean, fn: () => Promise<SourceSection>, fallback: (err?: unknown) => SourceSection) =>
    sample || !configured ? Promise.resolve(fallback()) : guard(fn, fallback);

  const [ga4, gsc, gbp, reviews, jobnimbus, pagespeed, site] = await Promise.all([
    live(ga4Status().state === "connected", async () => buildGa4Section(await cachedGa4(baseRange, cur(LAG.ga4)), baseRange, cur(LAG.ga4)), ga4Unavailable),
    live(gscStatus().state === "connected", async () => buildGscSection(await cachedGsc(baseRange, cur(LAG.gsc)), baseRange, cur(LAG.gsc)), gscUnavailable),
    live(gbpStatus().state === "connected", async () => buildGbpSection(await cachedGbp(baseRange, cur(LAG.gbp)), baseRange, cur(LAG.gbp)), gbpUnavailable),
    live(reviewsStatus().state === "connected", async () => buildReviewsSection(await cachedPlace(), snapshots), reviewsUnavailable),
    live(
      jobnimbusStatus().state === "connected",
      async () => buildJobNimbusSection(await cachedJn(baseRange, cur(LAG.jobnimbus), today), baseRange, cur(LAG.jobnimbus)),
      jobnimbusUnavailable,
    ),
    live(true, async () => buildPageSpeedSection(await cachedPsi(), snapshots), pagespeedUnavailable),
    sample ? Promise.resolve(siteUnavailable("sample")) : guard(async () => buildSiteSection(await cachedSite(), snapshots), siteUnavailable),
  ]);

  let sections: Record<SourceId, SourceSection> = { ga4, gsc, gbp, reviews, jobnimbus, pagespeed, site };

  if (sample) {
    const c = cur(1);
    const periods = [formatRange(baseRange), formatRange(c)] as const;
    const ranges = { baselineStart: baseRange.start, currentStart: c.start, days };
    sections = Object.fromEntries(
      Object.entries(sections).map(([k, s]) => [k, applySample(s, periods[0], periods[1], ranges)]),
    ) as Record<SourceId, SourceSection>;
    sections.site.metrics = [
      { key: "site.indexed", label: "Pages indexed", unit: "count", better: "up", source: "site", baseline: { value: 3, origin: "sample", period: periods[0] }, current: { value: 9, origin: "sample", period: periods[1] } },
      { key: "site.broken", label: "Broken URLs", unit: "count", better: "down", source: "site", baseline: { value: 14, origin: "sample", period: periods[0] }, current: { value: 0, origin: "sample", period: periods[1] } },
      { key: "site.tagged", label: "Pages with tracking", unit: "count", better: "up", source: "site", baseline: { value: 0, origin: "sample", period: periods[0] }, current: { value: 9, origin: "sample", period: periods[1] } },
    ];
    sections.site.status.detail = "Sample figures for layout review. Not WRS data.";
  }

  return {
    generatedAt: new Date().toISOString(),
    sample,
    window: {
      days,
      baseline: baseRange,
      current: cur(1),
      baselineIsFallback: base.fallback,
      overlapDays: Math.max(0, daysBetween(cur(1).start, baseRange.end) + 1),
    },
    areas: buildAreas(sections),
    sections,
  };
}

/** Used by the daily cron: collect the "right now" sources and store them. */
export async function collectSnapshot() {
  const [place, psi, site] = await Promise.allSettled([
    env.placesApiKey && env.placesId ? fetchPlace() : Promise.reject(new Error("Places not configured")),
    fetchPageSpeed(),
    runSiteAudit(),
  ]);
  return {
    date: todayIso(),
    reviews: place.status === "fulfilled" ? place.value : undefined,
    pagespeed: psi.status === "fulfilled" ? { score: psi.value.score, lcp: psi.value.lcp, cls: psi.value.cls } : undefined,
    site:
      site.status === "fulfilled"
        ? { urls: site.value.urls, broken: site.value.broken.length, tagged: site.value.tagged, indexed: site.value.indexed }
        : undefined,
    errors: [place, psi, site].filter((r) => r.status === "rejected").map((r) => String((r as PromiseRejectedResult).reason)),
  };
}
