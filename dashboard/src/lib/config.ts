import "server-only";
import baselineFile from "../../data/baseline.json";
import type { AreaId } from "./types";

export const SITE_URL = process.env.WRS_SITE_URL ?? "https://weatherrecoverysolutions.com";

/** Google Search Console keeps 16 months of data. */
export const GSC_RETENTION_DAYS = 486;

export const WINDOW_OPTIONS = [30, 60, 90] as const;
export type WindowDays = (typeof WINDOW_OPTIONS)[number];

export interface ManualFigure {
  value: number | null;
  date: string | null;
  source: string;
}

interface AreaText {
  area: string;
  changed: string;
  meaning: string;
  before: string | null;
  current: string | null;
}

interface BaselineFile {
  baselineStart: string | null;
  dxwStart: string | null;
  brandTerms: string[];
  areas: Record<AreaId, AreaText>;
  manual: Record<string, ManualFigure>;
}

export const baselineConfig = baselineFile as unknown as BaselineFile;

/** Env var BASELINE_START wins over the file so it can change without a commit. */
export function baselineStart(): string | null {
  return process.env.BASELINE_START || baselineConfig.baselineStart;
}

export function manualFigure(key: string): ManualFigure | null {
  const m = baselineConfig.manual[key];
  return m && typeof m.value === "number" ? m : null;
}

export function sampleMode(): boolean {
  return process.env.DASHBOARD_SAMPLE_DATA === "1";
}

export const env = {
  googleServiceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
  ga4PropertyId: process.env.GA4_PROPERTY_ID,
  gscSiteUrl: process.env.GSC_SITE_URL,
  gbpLocationId: process.env.GBP_LOCATION_ID,
  oauthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
  oauthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  gbpRefreshToken: process.env.GBP_REFRESH_TOKEN,
  placesApiKey: process.env.GOOGLE_PLACES_API_KEY,
  placesId: process.env.GOOGLE_PLACES_ID,
  pagespeedApiKey: process.env.PAGESPEED_API_KEY,
  jobnimbusApiKey: process.env.JOBNIMBUS_API_KEY,
  gtmId: process.env.GTM_ID,
  blobToken: process.env.BLOB_READ_WRITE_TOKEN,
};

export function missing(vars: Record<string, string | undefined>): string[] {
  return Object.entries(vars)
    .filter(([, v]) => !v)
    .map(([k]) => k);
}
