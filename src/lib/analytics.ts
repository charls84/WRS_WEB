declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export type EventParams = Record<string, string | number | boolean | undefined>;

export function track(event: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) cleaned[k] = v;
  }
  window.dataLayer.push({ event, ...cleaned });
}
