import type { Metric, Unit } from "./types";

const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const one = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatValue(value: number, unit: Unit): string {
  switch (unit) {
    case "percent":
      return `${one.format(value * 100)}%`;
    case "position":
      return one.format(value);
    case "rating":
      return one.format(value);
    case "seconds":
      return `${one.format(value)}s`;
    case "score":
      return int.format(value);
    default:
      return int.format(value);
  }
}

export function unitSuffix(unit: Unit): string {
  if (unit === "score") return "/100";
  if (unit === "rating") return "/5";
  return "";
}

/** Changes this small read as "no change" (grey) rather than better or worse. */
function isFlat(unit: Unit, base: number, diff: number): boolean {
  const abs = Math.abs(diff);
  switch (unit) {
    case "percent":
      return abs < 0.001; // under 0.1 points
    case "score":
      return abs < 1;
    case "rating":
      return abs < 0.05;
    case "position":
      return abs < 0.1;
    case "seconds":
      return abs < 0.05;
    default:
      return base === 0 ? abs === 0 : abs / base < 0.01; // under 1%
  }
}

export interface Delta {
  text: string;
  direction: "up" | "down" | "flat";
  improved: boolean | null; // null when flat or not comparable
}

/** Relative change for volumes; absolute change for rates, positions, ratings and times. */
export function delta(m: Metric): Delta | null {
  if (!m.baseline || !m.current) return null;
  const a = m.baseline.value;
  const b = m.current.value;
  const diff = b - a;
  const direction = isFlat(m.unit, a, diff) ? "flat" : diff > 0 ? "up" : "down";
  const improved = direction === "flat" ? null : (direction === "up") === (m.better === "up");
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";
  const abs = Math.abs(diff);

  let text: string;
  switch (m.unit) {
    case "percent":
      text = `${sign}${one.format(abs * 100)} pts`;
      break;
    case "position":
    case "rating":
      text = `${sign}${one.format(abs)}`;
      break;
    case "seconds":
      text = `${sign}${one.format(abs)}s`;
      break;
    case "score":
      text = `${sign}${int.format(abs)} pts`;
      break;
    default:
      text = a === 0 ? (b === 0 ? "±0" : `+${int.format(b)} new`) : `${sign}${int.format((abs / a) * 100)}%`;
  }
  return { text, direction, improved };
}
