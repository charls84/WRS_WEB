import * as Sentry from "@sentry/nextjs";

const JN_BASE_URL = "https://app.jobnimbus.com/api1";

const RECORD_TYPE = "Retail";
const LEAD_STATUS = "Lead";
const SALES_REP_NAME = "Andreia Medina";
const SALES_REP_ID = "l96iwcbzoplnkg9lrl4b1ce";

export type JnStep = "create_contact" | "create_note" | "create_task";

export interface ContactInput {
  name: string;
  phone: string;
  city?: string;
  locale: string;
}

export type ContactResult =
  | { ok: true; id: string; pending?: boolean }
  | { ok: false; error: string };

export type StepResult = { ok: true } | { ok: false; error: string };

function splitName(full: string): { first: string; last: string } {
  const trimmed = full.trim().replace(/\s+/g, " ");
  const parts = trimmed.split(" ");
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

function captureHttpFailure(step: JnStep, status: number, body: string): void {
  Sentry.captureMessage(`Job Nimbus ${step} HTTP ${status}`, {
    level: "error",
    tags: { integration: "jobnimbus", step },
    extra: { status, response_body: body.slice(0, 2000) },
  });
}

function captureThrow(step: JnStep, err: unknown): void {
  Sentry.captureException(err, {
    tags: { integration: "jobnimbus", step },
  });
}

export async function createContact(input: ContactInput): Promise<ContactResult> {
  const apiKey = process.env.JOBNIMBUS_API_KEY;

  if (!apiKey) {
    console.warn(
      `[jobnimbus] JOBNIMBUS_API_KEY not set — lead captured but NOT sent to CRM:`,
      JSON.stringify({ ...input, capturedAt: new Date().toISOString() })
    );
    return { ok: true, id: "pending-jn-integration", pending: true };
  }

  const { first, last } = splitName(input.name);

  const payload: Record<string, unknown> = {
    first_name: first,
    last_name: last,
    mobile_phone: input.phone,
    city: input.city || undefined,
    state_text: input.city ? "FL" : undefined,
    description: `Web inspection request (locale: ${input.locale})`,
    status_name: LEAD_STATUS,
    record_type_name: RECORD_TYPE,
    sales_rep: SALES_REP_ID,
    sales_rep_name: SALES_REP_NAME,
  };

  try {
    const res = await fetch(`${JN_BASE_URL}/contacts`, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[jobnimbus] createContact failed", res.status, text);
      captureHttpFailure("create_contact", res.status, text);
      return { ok: false, error: `jobnimbus_${res.status}` };
    }

    const data = (await res.json()) as { jnid?: string; recid?: string };
    const id = data.jnid || data.recid || "unknown";
    return { ok: true, id };
  } catch (err) {
    console.error("[jobnimbus] createContact threw", err);
    captureThrow("create_contact", err);
    return { ok: false, error: "network" };
  }
}

export interface ContactNoteInput {
  contactId: string;
  note: string;
}

export async function createContactNote(input: ContactNoteInput): Promise<StepResult> {
  const apiKey = process.env.JOBNIMBUS_API_KEY;
  if (!apiKey) return { ok: true };

  const payload = {
    record_type_name: "Note",
    note: input.note,
    primary: { id: input.contactId },
  };

  try {
    const res = await fetch(`${JN_BASE_URL}/activities`, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[jobnimbus] createContactNote failed", res.status, text);
      captureHttpFailure("create_note", res.status, text);
      return { ok: false, error: `jobnimbus_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.warn("[jobnimbus] createContactNote threw", err);
    captureThrow("create_note", err);
    return { ok: false, error: "network" };
  }
}

export interface NewLeadTaskInput {
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactCity?: string;
  contactService?: string;
  locale: string;
}

export async function createNewLeadTask(input: NewLeadTaskInput): Promise<StepResult> {
  const apiKey = process.env.JOBNIMBUS_API_KEY;
  if (!apiKey) return { ok: true };

  const nowSec = Math.floor(Date.now() / 1000);
  const cityPart = input.contactCity ? ` from ${input.contactCity}` : "";
  const title = `New website lead: ${input.contactName}${cityPart}`;
  const description = [
    `New inspection request submitted from the website.`,
    ``,
    `Name: ${input.contactName}`,
    `Phone: ${input.contactPhone}`,
    input.contactCity ? `City: ${input.contactCity}` : null,
    input.contactService ? `Requested service: ${input.contactService}` : null,
    `Locale: ${input.locale}`,
  ]
    .filter(Boolean)
    .join("\n");

  const payload = {
    title,
    description,
    priority: 1,
    date_start: nowSec,
    date_end: nowSec + 60 * 60,
    related: [{ id: input.contactId, type: "contact" }],
    owners: [{ id: SALES_REP_ID }],
  };

  try {
    const res = await fetch(`${JN_BASE_URL}/tasks`, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[jobnimbus] createNewLeadTask failed", res.status, text);
      captureHttpFailure("create_task", res.status, text);
      return { ok: false, error: `jobnimbus_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.warn("[jobnimbus] createNewLeadTask threw", err);
    captureThrow("create_task", err);
    return { ok: false, error: "network" };
  }
}
