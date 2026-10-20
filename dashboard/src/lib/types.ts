export type SourceId = "ga4" | "gsc" | "gbp" | "reviews" | "jobnimbus" | "pagespeed" | "site";

/** How a source gets into the dashboard once it is set up. */
export type Automation = "live" | "snapshot" | "manual";

export type SourceState =
  | "connected"
  | "not_configured"
  | "needs_approval"
  | "error"
  | "sample";

export interface SourceStatus {
  id: SourceId;
  name: string;
  state: SourceState;
  automation: Automation;
  /** What the source measures for WRS, in plain words. */
  provides: string;
  /** Env vars or one-time steps still missing; empty when connected. */
  setup: string[];
  /** Error text or a caveat about the data. */
  detail?: string;
}

export type Unit = "count" | "percent" | "position" | "score" | "rating" | "seconds" | "ratio";

/** Where a single figure came from. */
export type Origin = "api" | "snapshot" | "manual" | "sample";

export interface Figure {
  value: number;
  origin: Origin;
  /** Human-readable period or date the figure covers. */
  period: string;
  note?: string;
}

export interface Metric {
  key: string;
  label: string;
  unit: Unit;
  /** "up" when a higher value is an improvement. */
  better: "up" | "down";
  source: SourceId;
  baseline: Figure | null;
  current: Figure | null;
  /** Why a side is missing, shown instead of a number. */
  missing?: string;
}

export interface SeriesPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface Series {
  label: string;
  current: SeriesPoint[];
  baseline?: SeriesPoint[];
}

export interface TableRow {
  label: string;
  baseline: number | null;
  current: number | null;
}

export interface Table {
  title: string;
  columns: [string, string, string];
  rows: TableRow[];
  note?: string;
}

export interface Check {
  label: string;
  ok: boolean | null; // null = unknown (source not connected)
  detail: string;
}

export interface SourceSection {
  status: SourceStatus;
  baselinePeriod?: string;
  currentPeriod?: string;
  metrics: Metric[];
  series?: Series[];
  tables?: Table[];
  checks?: Check[];
}

export type AreaId = "search" | "website" | "leads" | "reputation" | "measurement" | "followup";

export interface AreaRow {
  id: AreaId;
  area: string;
  changed: string;
  meaning: string;
  /** Manual "before" text, used when no metric covers the baseline. */
  beforeText: string | null;
  /** Manual "current" text, used when no metric covers today. */
  currentText: string | null;
  metrics: Metric[];
}

export interface Window {
  days: number;
  baseline: { start: string; end: string };
  current: { start: string; end: string };
  baselineIsFallback: boolean;
  /** Baseline and current windows share days, so the comparison understates change. */
  overlapDays: number;
}

export interface Dashboard {
  generatedAt: string;
  sample: boolean;
  window: Window;
  areas: AreaRow[];
  sections: Record<SourceId, SourceSection>;
}
