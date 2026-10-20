import { formatValue, unitSuffix } from "@/lib/format";
import type { AreaRow, Metric, SourceSection } from "@/lib/types";
import { AutomationChip, CheckList, DataTable, DeltaChip, MetricTile, Sparkline, StateChip } from "./bits";

function Figure({ metric, side }: { metric: Metric; side: "baseline" | "current" }) {
  const f = metric[side];
  if (!f) return null;
  return (
    <div className="score-figure">
      <span className="value-line">
        <span className="value num">
          {formatValue(f.value, metric.unit)}
          {unitSuffix(metric.unit)}
        </span>
        {side === "current" && <DeltaChip metric={metric} />}
      </span>
      <span className="what">
        {metric.label}
        {f.origin === "manual" && " · entered by hand"}
        {f.origin === "snapshot" && " · first snapshot"}
      </span>
    </div>
  );
}

function SideCell({ row, side }: { row: AreaRow; side: "baseline" | "current" }) {
  const text = side === "baseline" ? row.beforeText : row.currentText;
  const withValue = row.metrics.filter((m) => m[side]);
  return (
    <div className="score-cell">
      <span className="label cell-label">{side === "baseline" ? "Before DXW" : "Current state"}</span>
      {text && <span className="text-cell">{text}</span>}
      {withValue.map((m) => (
        <Figure key={m.key} metric={m} side={side} />
      ))}
      {!text && !withValue.length && (
        <>
          <span className="unknown">?</span>
          {row.metrics.map((m) => (
            <span className="why" key={m.key}>
              {m.label}: {m.missing ?? "no data"}
            </span>
          ))}
        </>
      )}
    </div>
  );
}

export function Scorecard({ areas }: { areas: AreaRow[] }) {
  return (
    <div className="scorecard" role="table" aria-label="Baseline to today by area">
      <div className="score-head label" role="row">
        <div role="columnheader">Area</div>
        <div role="columnheader">Before DXW</div>
        <div role="columnheader">What we changed</div>
        <div role="columnheader">Current state</div>
        <div role="columnheader">Business meaning</div>
      </div>
      {areas.map((row) => (
        <div className="score-row" role="row" key={row.id}>
          <div role="cell">
            <span className="score-area">{row.area}</span>
          </div>
          <div role="cell">
            <SideCell row={row} side="baseline" />
          </div>
          <div role="cell" className="score-cell">
            <span className="label cell-label">What we changed</span>
            <span className="text-cell">{row.changed}</span>
          </div>
          <div role="cell">
            <SideCell row={row} side="current" />
          </div>
          <div role="cell" className="score-cell">
            <span className="label cell-label">Business meaning</span>
            <span className="text-cell">{row.meaning}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SourceBlock({ eyebrow, title, section }: { eyebrow: string; title: string; section: SourceSection }) {
  const { status } = section;
  return (
    <section className="section" aria-labelledby={`h-${status.id}`}>
      <div className="section-head">
        <div className="titles">
          <span className="label">{eyebrow}</span>
          <h2 className="display" id={`h-${status.id}`}>
            {title}
          </h2>
          <p className="section-sub">{status.provides}</p>
        </div>
        <div className="chips">
          <StateChip state={status.state} />
          <AutomationChip automation={status.automation} />
        </div>
      </div>
      {(section.baselinePeriod || section.currentPeriod) && (
        <div className="periods">
          {section.baselinePeriod && (
            <div className="period">
              <span className="label">Baseline</span>
              <span className="num">{section.baselinePeriod}</span>
            </div>
          )}
          {section.currentPeriod && (
            <div className="period">
              <span className="label">Current</span>
              <span className="num">{section.currentPeriod}</span>
            </div>
          )}
        </div>
      )}
      {section.metrics.length > 0 && (
        <div className="tiles">
          {section.metrics.map((m) => (
            <MetricTile key={m.key} metric={m} />
          ))}
        </div>
      )}
      {(section.series?.length || section.tables?.length || section.checks?.length) && (
        <div className="panels">
          {section.series?.map((s) => (
            <div className="panel" key={s.label}>
              <h3 className="display">{s.label}</h3>
              <Sparkline series={s} />
            </div>
          ))}
          {section.checks && <CheckList checks={section.checks} />}
          {section.tables?.map((t) => (
            <DataTable key={t.title} table={t} />
          ))}
        </div>
      )}
      {status.detail && <p className="source-detail">{status.state === "error" ? `Last error: ${status.detail}` : status.detail}</p>}
    </section>
  );
}

export function Connections({ sections }: { sections: SourceSection[] }) {
  return (
    <div className="panel">
      <div className="table-scroll">
        <table className="data connections">
          <thead>
            <tr>
              <th className="label" scope="col">
                Source
              </th>
              <th className="label" scope="col">
                How it updates
              </th>
              <th className="label" scope="col">
                Status
              </th>
              <th className="label" scope="col">
                Still needed
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map(({ status }) => (
              <tr key={status.id}>
                <td>
                  <span className="src">{status.name}</span>
                </td>
                <td>
                  <AutomationChip automation={status.automation} />
                </td>
                <td>
                  <StateChip state={status.state} />
                </td>
                <td>
                  {status.setup.length ? (
                    <ul>
                      {status.setup.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="note">Nothing</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
