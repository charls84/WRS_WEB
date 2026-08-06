import { type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { createContact, createContactNote, createNewLeadTask } from "@/lib/jobnimbus";
import { isValidLocale } from "@/i18n/locales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICE_OPTIONS = [
  "Full Replacement",
  "Repair",
  "Inspection",
  "Coating (Waterproofing)",
  "Emergency",
  "Other",
] as const;

interface RequestBody {
  name?: string;
  phone?: string;
  city?: string;
  service?: string;
  recaptchaToken?: string;
  locale?: string;
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const city = (body.city || "").trim();
  const rawService = (body.service || "").trim();
  const service = (SERVICE_OPTIONS as readonly string[]).includes(rawService) ? rawService : "";
  const locale = body.locale && isValidLocale(body.locale) ? body.locale : "en";

  if (!name) {
    return Response.json({ ok: false, error: "name_required" }, { status: 400 });
  }
  if (digitsOnly(phone).length < 10) {
    return Response.json({ ok: false, error: "phone_invalid" }, { status: 400 });
  }

  const captcha = await verifyRecaptcha(body.recaptchaToken, "contact_form");
  if (!captcha.ok) {
    return Response.json({ ok: false, error: "spam_rejected", reason: captcha.reason }, { status: 403 });
  }

  Sentry.setTag("source", "web_contact_form");
  Sentry.setContext("lead", { name, phone, city, service, locale });

  const result = await createContact({ name, phone, city: city || undefined, locale });
  if (!result.ok) {
    return Response.json({ ok: false, error: "crm_failed" }, { status: 502 });
  }

  if (!result.pending) {
    const failedSteps: string[] = [];

    if (service) {
      const noteResult = await createContactNote({
        contactId: result.id,
        note: `Requested service: ${service}`,
      });
      if (!noteResult.ok) failedSteps.push("create_note");
    }

    const taskResult = await createNewLeadTask({
      contactId: result.id,
      contactName: name,
      contactPhone: phone,
      contactCity: city || undefined,
      contactService: service || undefined,
      locale,
    });
    if (!taskResult.ok) failedSteps.push("create_task");

    if (failedSteps.length > 0) {
      Sentry.captureMessage("Job Nimbus partial failure (contact created, downstream step failed)", {
        level: "warning",
        tags: { integration: "jobnimbus", partial: "true" },
        extra: { contactId: result.id, failedSteps },
      });
    }
  }

  return Response.json({ ok: true, id: result.id, pending: result.pending ?? false });
}
