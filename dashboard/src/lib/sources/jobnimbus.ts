import "server-only";
import { env, missing } from "../config";
import { emptyMetric, errorMessage, figure, placeholderSection, safeDivide, withManualBaseline } from "../metrics";
import { formatRange, unixSeconds, type Range } from "../periods";
import type { Metric, SourceSection, SourceStatus, Table } from "../types";

const BASE = "https://app.jobnimbus.com/api1";
const PAGE = 1000;
const MAX_RECORDS = 10_000;

/** The WRS site's form handler (src/lib/jobnimbus.ts) writes this description on every web lead. */
const WEB_LEAD_PREFIX = "Web inspection request";

interface Contact {
  jnid: string;
  date_created: number;
  source_name?: string;
  status_name?: string;
  description?: string;
}
interface Job {
  jnid: string;
  date_created: number;
  primary?: { id?: string };
}

export function jobnimbusStatus(): SourceStatus {
  const setup = missing({ JOBNIMBUS_API_KEY: env.jobnimbusApiKey });
  return {
    id: "jobnimbus",
    name: "JobNimbus",
    state: setup.length ? "not_configured" : "connected",
    automation: "live",
    provides: "Leads received, lead source, current status and how many leads turned into a job.",
    setup: setup.length ? [...setup, "Use a read-only API key from JobNimbus Settings → API"] : [],
    detail: "Lead-to-appointment needs appointments logged in JobNimbus. Lead-to-job counts contacts that have a job attached.",
  };
}

export function jobnimbusMetrics(): Metric[] {
  const why = "JobNimbus not connected";
  return [
    emptyMetric("jobnimbus.leads", "Leads in CRM", "count", "jobnimbus", why),
    emptyMetric("jobnimbus.webLeads", "Leads from the website", "count", "jobnimbus", why),
    emptyMetric("jobnimbus.withJob", "Leads that became a job", "count", "jobnimbus", why),
    emptyMetric("jobnimbus.jobRate", "Lead-to-job rate", "percent", "jobnimbus", why),
  ];
}

async function list<T>(path: "contacts" | "jobs", range: Range, fields: string): Promise<T[]> {
  const filter = JSON.stringify({
    must: [{ range: { date_created: { gte: unixSeconds(range.start), lte: unixSeconds(range.end, true) } } }],
  });
  const out: T[] = [];
  for (let from = 0; from < MAX_RECORDS; from += PAGE) {
    const qs = new URLSearchParams({ filter, size: String(PAGE), from: String(from), fields });
    const res = await fetch(`${BASE}/${path}?${qs}`, {
      headers: { Authorization: `Bearer ${env.jobnimbusApiKey}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`JobNimbus ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as { count?: number; results?: T[] };
    const batch = data.results ?? [];
    out.push(...batch);
    if (batch.length < PAGE || out.length >= (data.count ?? 0)) break;
  }
  return out;
}

async function periodData(range: Range, jobsUntil: string) {
  const contacts = await list<Contact>("contacts", range, "jnid,date_created,source_name,status_name,description");
  // Jobs can be created after the lead period ends, so look up to today.
  const jobs = await list<Job>("jobs", { start: range.start, end: jobsUntil }, "jnid,date_created,primary");
  const withJob = new Set(jobs.map((j) => j.primary?.id).filter(Boolean));
  const tally = (pick: (c: Contact) => string) => {
    const m = new Map<string, number>();
    for (const c of contacts) m.set(pick(c), (m.get(pick(c)) ?? 0) + 1);
    return m;
  };
  return {
    leads: contacts.length,
    webLeads: contacts.filter((c) => c.source_name?.toLowerCase().includes("website") || c.description?.startsWith(WEB_LEAD_PREFIX)).length,
    withJob: contacts.filter((c) => withJob.has(c.jnid)).length,
    bySource: tally((c) => c.source_name || "(no source set)"),
    byStatus: tally((c) => c.status_name || "(no status)"),
  };
}

export type JobNimbusData = { baseline: Awaited<ReturnType<typeof periodData>>; current: Awaited<ReturnType<typeof periodData>> };

export async function fetchJobNimbus(baseline: Range, current: Range, today: string): Promise<JobNimbusData> {
  const [b, c] = await Promise.all([periodData(baseline, today), periodData(current, today)]);
  return { baseline: b, current: c };
}

function mapTable(title: string, first: string, b: Map<string, number>, c: Map<string, number>): Table {
  const labels = new Set([...b.keys(), ...c.keys()]);
  const rows = [...labels]
    .map((label) => ({ label, baseline: b.get(label) ?? 0, current: c.get(label) ?? 0 }))
    .sort((x, y) => y.current - x.current || y.baseline - x.baseline)
    .slice(0, 8);
  return { title, columns: [first, "Baseline", "Current"], rows };
}

export function buildJobNimbusSection(data: JobNimbusData, baseline: Range, current: Range): SourceSection {
  const b = formatRange(baseline);
  const c = formatRange(current);
  const make = (key: string, label: string, unit: Metric["unit"], get: (d: JobNimbusData["current"]) => number | null): Metric =>
    withManualBaseline({
      key,
      label,
      unit,
      better: "up",
      source: "jobnimbus",
      baseline: figure(get(data.baseline), "api", b),
      current: figure(get(data.current), "api", c),
    });
  return {
    status: jobnimbusStatus(),
    baselinePeriod: b,
    currentPeriod: c,
    metrics: [
      make("jobnimbus.leads", "Leads in CRM", "count", (d) => d.leads),
      make("jobnimbus.webLeads", "Leads from the website", "count", (d) => d.webLeads),
      make("jobnimbus.withJob", "Leads that became a job", "count", (d) => d.withJob),
      make("jobnimbus.jobRate", "Lead-to-job rate", "percent", (d) => safeDivide(d.withJob, d.leads)),
    ],
    tables: [
      mapTable("Leads by source", "Source", data.baseline.bySource, data.current.bySource),
      mapTable("Leads by current status", "Status", data.baseline.byStatus, data.current.byStatus),
    ],
  };
}

export function jobnimbusUnavailable(err?: unknown): SourceSection {
  const status = jobnimbusStatus();
  if (err) {
    status.state = "error";
    status.detail = errorMessage(err);
  }
  return placeholderSection(status, jobnimbusMetrics());
}
