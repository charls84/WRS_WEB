import "server-only";
import { env, SITE_URL } from "../config";
import { googleJson, serviceAccountToken } from "../google-auth";
import { errorMessage, figure, manualOrSnapshot } from "../metrics";
import { formatDate, todayIso } from "../periods";
import { firstWith, type Snapshot } from "../snapshots";
import type { Check, Metric, SourceSection, SourceStatus } from "../types";

const MAX_URLS = 60;

export interface SiteAudit {
  urls: number;
  broken: { url: string; status: number }[];
  tagged: number; // pages whose HTML loads the GTM container
  indexed: number | null; // null when Search Console is not connected
  notIndexed: { url: string; state: string }[];
  sitemapOk: boolean;
  robotsOk: boolean;
}

export function siteStatus(): SourceStatus {
  const setup: string[] = [];
  if (!env.gtmId) setup.push("GTM_ID (to check the tag on every page; otherwise any GTM container counts)");
  if (!env.googleServiceAccount || !env.gscSiteUrl) setup.push("Search Console connection (for indexing status)");
  return {
    id: "site",
    name: "Site crawl",
    state: "connected",
    automation: "snapshot",
    provides: "Checks every sitemap URL for errors, the Tag Manager tag and Google indexing. Runs daily.",
    setup,
  };
}

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

async function fetchText(url: string): Promise<{ status: number; text: string }> {
  const res = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    headers: { "User-Agent": "DOUX.WORK dashboard crawler" },
    signal: AbortSignal.timeout(20_000),
  });
  return { status: res.status, text: res.ok ? await res.text() : "" };
}

async function inspect(urls: string[]): Promise<{ indexed: number; notIndexed: SiteAudit["notIndexed"] } | null> {
  if (!env.googleServiceAccount || !env.gscSiteUrl) return null;
  const token = await serviceAccountToken(["https://www.googleapis.com/auth/webmasters.readonly"]);
  const results = await Promise.all(
    urls.map(async (url) => {
      const r = await googleJson<{ inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string } } }>(
        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        token,
        { inspectionUrl: url, siteUrl: env.gscSiteUrl },
      );
      const s = r.inspectionResult?.indexStatusResult;
      return { url, ok: s?.verdict === "PASS", state: s?.coverageState ?? "Unknown" };
    }),
  );
  return { indexed: results.filter((r) => r.ok).length, notIndexed: results.filter((r) => !r.ok).map(({ url, state }) => ({ url, state })) };
}

export async function runSiteAudit(): Promise<SiteAudit> {
  const [sitemap, robots] = await Promise.all([fetchText(`${SITE_URL}/sitemap.xml`), fetchText(`${SITE_URL}/robots.txt`)]);
  const urls = extractLocs(sitemap.text).slice(0, MAX_URLS);
  const marker = env.gtmId ?? "googletagmanager.com/gtm.js";
  const pages = await Promise.all(
    urls.map(async (url) => {
      try {
        const r = await fetchText(url);
        return { url, status: r.status, tagged: r.text.includes(marker) };
      } catch {
        return { url, status: 0, tagged: false };
      }
    }),
  );
  let indexing: Awaited<ReturnType<typeof inspect>> = null;
  try {
    indexing = await inspect(urls);
  } catch {
    indexing = null;
  }
  return {
    urls: urls.length,
    broken: pages.filter((p) => p.status === 0 || p.status >= 400).map(({ url, status }) => ({ url, status })),
    tagged: pages.filter((p) => p.tagged).length,
    indexed: indexing?.indexed ?? null,
    notIndexed: indexing?.notIndexed ?? [],
    sitemapOk: sitemap.status === 200 && urls.length > 0,
    robotsOk: robots.status === 200,
  };
}

export function buildSiteSection(audit: SiteAudit, snapshots: Snapshot[]): SourceSection {
  const first = firstWith(snapshots, "site");
  const firstPeriod = first ? `First snapshot, ${formatDate(first.date)}` : "";
  const today = `Today, ${formatDate(todayIso())}`;
  const missingBase = "No baseline yet: first daily snapshot pending";
  const m = (key: string, label: string, better: Metric["better"], now: number | null, then: number | null | undefined): Metric =>
    manualOrSnapshot(
      { key, label, unit: "count", better, source: "site", baseline: null, current: figure(now, "api", today), missing: missingBase },
      first ? figure(then, "snapshot", firstPeriod) : null,
    );

  const checks: Check[] = [
    { label: "Sitemap published", ok: audit.sitemapOk, detail: audit.sitemapOk ? `${audit.urls} URLs listed` : "sitemap.xml missing or empty" },
    { label: "robots.txt published", ok: audit.robotsOk, detail: audit.robotsOk ? "Found" : "Missing (listed in OPEN_ITEMS.md)" },
    {
      label: "Tag Manager on every page",
      ok: audit.urls > 0 ? audit.tagged === audit.urls : null,
      detail: `${audit.tagged} of ${audit.urls} pages load the tag`,
    },
    { label: "No broken URLs", ok: audit.broken.length === 0, detail: audit.broken.length ? audit.broken.map((b) => `${b.status} ${b.url}`).join(", ") : "All sitemap URLs return 200" },
    {
      label: "All pages indexed by Google",
      ok: audit.indexed === null ? null : audit.indexed === audit.urls,
      detail:
        audit.indexed === null
          ? "Needs Search Console"
          : audit.notIndexed.length
            ? audit.notIndexed.map((n) => `${n.url}: ${n.state}`).join("; ")
            : `${audit.indexed} of ${audit.urls} indexed`,
    },
  ];

  return {
    status: siteStatus(),
    metrics: [
      m("site.indexed", "Pages indexed", "up", audit.indexed, first?.site.indexed),
      m("site.broken", "Broken URLs", "down", audit.broken.length, first?.site.broken),
      m("site.tagged", "Pages with tracking", "up", audit.tagged, first?.site.tagged),
    ],
    checks,
  };
}

export function siteUnavailable(err: unknown): SourceSection {
  const status = siteStatus();
  status.state = "error";
  status.detail = errorMessage(err);
  return { status, metrics: [] };
}
