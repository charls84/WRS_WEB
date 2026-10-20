import { formatDate } from "./periods";
import { manualFigure } from "./config";
import type { Figure, Metric, Origin, SourceSection, SourceStatus } from "./types";

export function figure(value: number | null | undefined, origin: Origin, period: string, note?: string): Figure | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return { value, origin, period, note };
}

/** Fill an empty baseline from data/baseline.json when the API cannot reach that far back. */
export function withManualBaseline(m: Metric): Metric {
  if (m.baseline) return m;
  const manual = manualFigure(m.key);
  if (!manual) return m;
  return {
    ...m,
    baseline: {
      value: manual.value as number,
      origin: "manual",
      period: manual.date ? formatDate(manual.date) : "Before DXW",
      note: manual.source || "Entered by hand",
    },
  };
}

export function emptyMetric(
  key: string,
  label: string,
  unit: Metric["unit"],
  source: Metric["source"],
  missing: string,
  better: Metric["better"] = "up",
): Metric {
  return withManualBaseline({ key, label, unit, better, source, baseline: null, current: null, missing });
}

/** A section for a source that is not connected or failed: same metrics, no numbers. */
export function placeholderSection(status: SourceStatus, metrics: Metric[]): SourceSection {
  return { status, metrics: metrics.map(withManualBaseline) };
}

export function errorMessage(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  // Google wraps errors as JSON; keep only the human message.
  const json = err.message.match(/"message":\s*"([^"]+)"/);
  const base = json ? `${err.message.split(":")[0]}: ${json[1]}` : err.message;
  const cause = (err as Error & { cause?: { code?: string; message?: string } }).cause;
  return cause ? `${base} (${cause.code ?? cause.message})` : base;
}

export function safeDivide(a: number, b: number): number | null {
  return b > 0 ? a / b : null;
}

/**
 * For sources that only report "today": a hand-entered pre-DXW figure is the
 * truer baseline, so it wins; the first daily snapshot is the fallback.
 */
export function manualOrSnapshot(m: Metric, snapshot: Figure | null): Metric {
  const withManual = withManualBaseline({ ...m, baseline: null });
  if (withManual.baseline || !snapshot) return withManual;
  return { ...withManual, baseline: snapshot, missing: undefined };
}
