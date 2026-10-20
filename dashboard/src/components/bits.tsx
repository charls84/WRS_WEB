import { delta, formatValue, unitSuffix } from "@/lib/format";
import type { Automation, Check, Metric, Series, SourceState, Table } from "@/lib/types";

const ORIGIN_LABEL = { api: "", snapshot: "Snapshot", manual: "Entered by hand", sample: "Sample" } as const;

export function DeltaChip({ metric }: { metric: Metric }) {
  const d = delta(metric);
  if (!d) return null;
  const glyph = d.direction === "up" ? "▲" : d.direction === "down" ? "▼" : "■";
  const cls = d.improved === null ? "delta delta--flat" : d.improved ? "delta delta--good" : "delta delta--bad";
  const verdict = d.improved === null ? "no change" : d.improved ? "better" : "worse";
  return (
    <span className={cls} title={`${d.text} vs baseline (${verdict})`}>
      <span aria-hidden="true">{glyph} </span>
      {d.text}
      <span className="sr-only"> ({verdict})</span>
    </span>
  );
}

const STATE: Record<SourceState, { text: string; cls: string }> = {
  connected: { text: "Connected", cls: "chip chip--solid" },
  not_configured: { text: "Not connected", cls: "chip chip--muted" },
  needs_approval: { text: "Needs Google approval", cls: "chip chip--warn" },
  error: { text: "Error", cls: "chip chip--warn" },
  sample: { text: "Sample data", cls: "chip chip--dashed" },
};

export function StateChip({ state }: { state: SourceState }) {
  return <span className={STATE[state].cls}>{STATE[state].text}</span>;
}

const AUTOMATION: Record<Automation, string> = {
  live: "Automatic · live API",
  snapshot: "Automatic · daily snapshot",
  manual: "Manual",
};

export function AutomationChip({ automation }: { automation: Automation }) {
  return <span className={automation === "manual" ? "chip chip--muted" : "chip chip--auto"}>{AUTOMATION[automation]}</span>;
}

export function MetricTile({ metric }: { metric: Metric }) {
  const { current, baseline } = metric;
  return (
    <div className={current ? "tile" : "tile tile--empty"}>
      <span className="label">{metric.label}</span>
      <div className="big">
        <span className="value num">{current ? formatValue(current.value, metric.unit) : "—"}</span>
        {current && unitSuffix(metric.unit) && <span className="suffix">{unitSuffix(metric.unit)}</span>}
        <DeltaChip metric={metric} />
      </div>
      {baseline ? (
        <span className="baseline-line">
          Baseline <strong className="num">{formatValue(baseline.value, metric.unit)}</strong> · {baseline.period}
          {baseline.origin !== "api" && ` · ${baseline.note ?? ORIGIN_LABEL[baseline.origin]}`}
        </span>
      ) : (
        <span className="baseline-line">{metric.missing ?? "No baseline"}</span>
      )}
      {current && current.origin !== "api" && current.origin !== "sample" && <span className="note">{ORIGIN_LABEL[current.origin]}</span>}
    </div>
  );
}

/** Daily line for the current window with the baseline window overlaid day-by-day. */
export function Sparkline({ series }: { series: Series }) {
  const W = 600;
  const H = 160;
  const PAD = 8;
  const cur = series.current;
  const base = series.baseline ?? [];
  const n = Math.max(cur.length, base.length);
  if (n < 2) return <p className="note">Not enough days yet to draw a trend.</p>;
  const max = Math.max(1, ...cur.map((p) => p.value), ...base.map((p) => p.value));
  const x = (i: number) => PAD + (i / (n - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const line = (pts: { value: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = cur.length > 1 ? `${line(cur)} L${x(cur.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z` : "";
  const last = cur[cur.length - 1];

  return (
    <div className="chart">
      <div className="legend label">
        <span>
          <i className="swatch" aria-hidden="true" /> Current
        </span>
        {base.length > 1 && (
          <span>
            <i className="swatch swatch--baseline" aria-hidden="true" /> Baseline (same day of window)
          </span>
        )}
        <span>Peak {formatValue(max, "count")}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${series.label}: current window ends at ${last ? formatValue(last.value, "count") : "no data"}`}>
        <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <line x1={PAD} x2={W - PAD} y1={y(max / 2)} y2={y(max / 2)} stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        {area && <path d={area} fill="var(--chart-fill)" stroke="none" />}
        {base.length > 1 && (
          <path d={line(base)} fill="none" stroke="var(--chart-baseline)" strokeWidth="1.5" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
        )}
        {cur.length > 1 && <path d={line(cur)} fill="none" stroke="var(--text)" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="axis label">
        <span>{cur[0]?.date ?? base[0]?.date}</span>
        <span>{last?.date}</span>
      </div>
    </div>
  );
}

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function DataTable({ table }: { table: Table }) {
  return (
    <div className="panel">
      <h3 className="display">{table.title}</h3>
      {table.rows.length ? (
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                {table.columns.map((c) => (
                  <th key={c} className="label" scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td>{r.baseline === null ? "—" : nf.format(r.baseline)}</td>
                  <td>
                    <strong>{r.current === null ? "—" : nf.format(r.current)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="note">No rows for this period.</p>
      )}
      {table.note && <p className="note">{table.note}</p>}
    </div>
  );
}

export function CheckList({ checks }: { checks: Check[] }) {
  return (
    <div className="panel">
      <h3 className="display">Health checks</h3>
      <ul className="checks">
        {checks.map((c) => (
          <li key={c.label}>
            <span className={c.ok === null ? "mark mark--unknown" : c.ok ? "mark mark--ok" : "mark mark--fail"} aria-label={c.ok === null ? "Unknown" : c.ok ? "Pass" : "Fail"}>
              {c.ok === null ? "?" : c.ok ? "✓" : "✕"}
            </span>
            <div>
              <div>{c.label}</div>
              <div className="detail">{c.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
