"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, type Locale } from "@/i18n";
import { track } from "@/lib/analytics";
import { renderBold } from "./PageSections";
import { useStickyNav } from "./JumpNav";

/* ─── Hero Carousel ─── */
export type HeroSlide = {
  mobile: string;
  tablet: string;
  desktop: string;
  alt: string;
  caption: string;
};

export function HeroCarousel({
  slides,
  intervalMs = 5000,
}: {
  slides: HeroSlide[];
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);
  const [mountRest, setMountRest] = useState(false);

  useEffect(() => {
    if (slides.length <= 1) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const id = setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  // Defer mounting of non-active slides so their images don't compete
  // with the LCP image for bandwidth during initial page load.
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setTimeout(() => setMountRest(true), 1500);
    return () => window.clearTimeout(id);
  }, [slides.length]);

  return (
    <>
      {/* Mobile + tablet figure (full-width, 3:2 → 16:9) */}
      <figure
        className="relative aspect-[3/2] md:aspect-video w-full overflow-hidden bg-[#D0D6D9] m-0 xl:hidden"
        aria-roledescription="carousel"
      >
        {slides.map((slide, i) => {
          if (i > 0 && !mountRest) return null;
          return (
            <div
              key={slide.mobile}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={i !== active}
            >
              <Image
                src={slide.mobile}
                alt={slide.alt}
                fill
                sizes="100vw"
                className="object-cover md:hidden"
                priority={i === 0}
                fetchPriority={i === 0 ? "high" : undefined}
              />
              <Image
                src={slide.tablet}
                alt={slide.alt}
                fill
                sizes="100vw"
                className="object-cover hidden md:block"
              />
            </div>
          );
        })}
        <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-transparent to-[rgba(0,20,22,0.55)]">
          <div className="flex justify-end px-3 py-2">
            <span
              key={active}
              className="text-[12px] md:text-[14px] font-[500] text-[#D0D6D9] leading-[1.5]"
              aria-live="polite"
            >
              {slides[active].caption}
            </span>
          </div>
        </figcaption>
      </figure>

      {/* Desktop figure (right column, 1:1 square) */}
      <figure
        className="hidden xl:block xl:order-2 xl:flex-1 m-0"
        aria-roledescription="carousel"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-[#D0D6D9]">
          {slides.map((slide, i) => {
            if (i > 0 && !mountRest) return null;
            return (
              <div
                key={slide.desktop}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  i === active ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden={i !== active}
              >
                <Image
                  src={slide.desktop}
                  alt={slide.alt}
                  fill
                  sizes="(min-width: 1920px) 960px, 50vw"
                  className="object-cover"
                  priority={i === 0}
                  fetchPriority={i === 0 ? "high" : undefined}
                />
              </div>
            );
          })}
          <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-transparent to-[rgba(0,20,22,0.55)]">
            <div className="flex justify-end px-6 py-3">
              <span
                key={active}
                className="text-[14px] font-[500] text-[#D0D6D9] leading-[1.5]"
                aria-live="polite"
              >
                {slides[active].caption}
              </span>
            </div>
          </figcaption>
        </div>
      </figure>
    </>
  );
}

/* ─── FAQ ─── */

interface FAQItemProps {
  index: number;
  question: string;
  answer: string;
}

export function FAQItem({ index, question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const headingId = `faq-q${index}`;

  return (
    <div role="region" aria-labelledby={headingId} className="border-b border-[#9CA9B0] last:border-0">
      <h3 id={headingId}>
        <button
          onClick={() => {
            const next = !isOpen;
            setIsOpen(next);
            track("faq_toggle", {
              faq_index: index,
              faq_question: question,
              faq_state: next ? "open" : "close",
            });
          }}
          className="w-full py-6 flex items-start justify-between text-left"
          aria-expanded={isOpen}
        >
          <span className="h3 text-[#001416] pr-4">
            {question}
          </span>
          <span className="shrink-0 grid place-items-center size-10 rounded-full text-[#018293]">
            <svg
              width="20"
              height="10"
              viewBox="0 0 20 10"
              fill="none"
              aria-hidden="true"
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            >
              <path
                d="M1.5 1.5 L10 8.5 L18.5 1.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </h3>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="body-regular text-[#001416] whitespace-pre-line pb-6">
            {renderBold(answer)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Contact Form ─── */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

function injectRecaptchaScript() {
  if (typeof window === "undefined") return;
  if (!RECAPTCHA_SITE_KEY) return;
  if (document.querySelector("script[data-recaptcha-injected]")) return;
  const s = document.createElement("script");
  s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
  s.async = true;
  s.defer = true;
  s.dataset.recaptchaInjected = "1";
  document.head.appendChild(s);
}

async function getRecaptchaToken(): Promise<string | undefined> {
  if (!RECAPTCHA_SITE_KEY || typeof window === "undefined") return undefined;

  // Submit may fire before the lazy script finished loading — kick off the
  // injection (idempotent) and poll briefly for grecaptcha to appear.
  injectRecaptchaScript();
  const deadline = Date.now() + 3000;
  while (!window.grecaptcha && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 50));
  }
  if (!window.grecaptcha) return undefined;

  return new Promise<string | undefined>((resolve) => {
    window.grecaptcha!.ready(async () => {
      try {
        const token = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY!, {
          action: "contact_form",
        });
        resolve(token);
      } catch {
        resolve(undefined);
      }
    });
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- only used by the temporarily hidden SMS consent disclosure
function legalHref(locale: Locale, path: string) {
  return locale === "en" ? path : `/${locale}${path}`;
}

export function ContactForm() {
  const { t, locale } = useLocale();
  const [formData, setFormData] = useState({ name: "", phone: "", city: "", service: "" });
  const [errors, setErrors] = useState({ name: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!submitted) return;
    track("generate_lead", {
      form_id: "contact",
      service: formData.service || undefined,
      locale,
    });
  }, [submitted, formData.service, locale]);

  // Lazy-load reCAPTCHA when the form section enters the viewport, so the
  // ~70KB script and its setup work don't block initial page load.
  useEffect(() => {
    if (typeof window === "undefined" || !RECAPTCHA_SITE_KEY) return;
    const section = document.getElementById("inspection-form");
    if (!section || !("IntersectionObserver" in window)) {
      const id = window.setTimeout(injectRecaptchaScript, 3000);
      return () => window.clearTimeout(id);
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          injectRecaptchaScript();
          obs.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 0) return "";
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    // If the formatted value matches what's already in state, React will skip
    // the DOM update — leaving any stray characters (extra digits past 10,
    // letters, etc.) visible in the input. Force-sync the DOM here.
    if (e.target.value !== formattedValue) {
      e.target.value = formattedValue;
    }
    setFormData((prev) => ({ ...prev, phone: formattedValue }));
    if (formattedValue.length === 14) setErrors((prev) => ({ ...prev, phone: "" }));
  };

  const validate = () => {
    const newErrors = { name: "", phone: "" };
    let isValid = true;
    if (!formData.name.trim()) {
      newErrors.name = t.form.errorName;
      isValid = false;
    }
    if (formData.phone.length < 14) {
      newErrors.phone = t.form.errorPhone;
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const recaptchaToken = await getRecaptchaToken();
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          city: formData.city,
          service: formData.service,
          recaptchaToken,
          locale,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else if (res.status === 403) {
        setServerError(t.form.errorSpam);
      } else {
        setServerError(t.form.errorSubmit);
      }
    } catch {
      setServerError(t.form.errorSubmit);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-[#E6F4F5] rounded-[8px] border-3 border-white p-6 flex flex-col gap-4 mx-auto w-full max-w-[358px] xl:max-w-[var(--container-content)] xl:flex-row xl:items-stretch xl:gap-0">
      <div className="flex flex-col gap-4 xl:flex-1 xl:min-w-0 xl:px-6">
      <header className="text-left">
        <h2
          id="form-heading"
          className="h2 text-[#001416] capitalize"
        >
          {t.form.heading}
        </h2>
      </header>

      <ul className="flex flex-col gap-1 list-none p-0 m-0" aria-label="Our Service Guarantees">
        {t.form.assurances.map((text, i) => (
          <li key={i}>
            <FormAssurance text={text} />
          </li>
        ))}
      </ul>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={submitted || submitting} className="flex flex-col gap-4">
          <legend className="sr-only">Roof inspection request form</legend>
          <div className="flex flex-col">
            <label htmlFor="full-name" className="caption text-[#001416] pb-1">{t.form.labelName}</label>
            <input
              type="text"
              id="full-name"
              name="full-name"
              required
              placeholder={t.form.placeholderName}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              aria-describedby={errors.name ? "name-error" : undefined}
              aria-invalid={errors.name ? true : undefined}
              className={`w-full h-[48px] px-3 rounded-[4px] border bg-white ${
                errors.name ? "border-red-500" : "border-[var(--divider-color)]"
              } body-small focus:border-[#018293] outline-none disabled:bg-[#F5F7F8] disabled:text-[#001416] disabled:opacity-100`}
            />
            {errors.name && (
              <p id="name-error" role="alert" className="caption text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col">
            <label htmlFor="phone" className="caption text-[#001416] pb-1">{t.form.labelPhone}</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              inputMode="numeric"
              autoComplete="tel"
              maxLength={14}
              placeholder={t.form.placeholderPhone}
              value={formData.phone}
              onChange={handlePhoneChange}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              aria-invalid={errors.phone ? true : undefined}
              className={`w-full h-[48px] px-3 rounded-[4px] border bg-white ${
                errors.phone ? "border-red-500" : "border-[var(--divider-color)]"
              } body-small focus:border-[#018293] outline-none disabled:bg-[#F5F7F8] disabled:text-[#001416] disabled:opacity-100`}
            />
            {errors.phone && (
              <p id="phone-error" role="alert" className="caption text-red-500 mt-1">{errors.phone}</p>
            )}
            {/* SMS consent disclosure temporarily hidden (Jul 2026) — restore by uncommenting
            <p id="sms-consent" className="text-[10px] text-[#63737D] mt-1 leading-[1.4]">
              {t.form.smsConsent.map((seg, i) =>
                "href" in seg && seg.href ? (
                  <Link
                    key={i}
                    href={legalHref(locale, seg.href)}
                    className="underline hover:text-[#018293]"
                  >
                    {seg.text}
                  </Link>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
            </p>
            */}
          </div>

          <div className="flex flex-col">
            <label htmlFor="service" className="caption text-[#001416] pb-1">{t.form.labelService}</label>
            <select
              id="service"
              name="service"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full h-[48px] px-3 rounded-[4px] border border-[var(--divider-color)] body-small text-[#001416] focus:border-[#018293] outline-none disabled:bg-[#F5F7F8] disabled:text-[#001416] disabled:opacity-100 bg-white appearance-none bg-no-repeat"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2363737D' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 14px center",
                paddingRight: "36px",
              }}
            >
              <option value="">{t.form.placeholderService}</option>
              {t.form.serviceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="city" className="caption text-[#001416] pb-1">{t.form.labelCity}</label>
            <input
              type="text"
              id="city"
              name="city"
              placeholder={t.form.placeholderCity}
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              aria-description="Enter your city in Broward or Palm Beach County"
              className="w-full h-[48px] px-3 rounded-[4px] border border-[var(--divider-color)] bg-white body-small focus:border-[#018293] outline-none disabled:bg-[#F5F7F8] disabled:text-[#001416] disabled:opacity-100"
            />
          </div>
        </fieldset>

        <div className="pt-2">
          {submitted ? (
            <div className="w-full text-center py-4 px-4 rounded-[8px] bg-[#EAF7E8] border border-[#269B1D]" role="status" aria-live="polite">
              <p className="body-regular font-bold text-[#269B1D] tracking-[0.16px]">
                {t.form.successTitle}
              </p>
              <p className="body-small text-[#001416] mt-1">
                {t.form.successBody}
              </p>
              <p className="body-small text-[#001416] mt-2">
                {t.form.successCallPrefix}
                <a
                  href="tel:9549996600"
                  data-track-location="form-success"
                  className="font-bold text-[#269B1D] underline whitespace-nowrap"
                >
                  954-999-6600
                </a>
              </p>
            </div>
          ) : (
            <>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#001416] text-white font-bold py-3 rounded-full text-[16px] tracking-[0.16px] transition-all hover:bg-[#0a2a2e] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? t.form.submittingButton : t.form.submitButton}
              </button>
              {serverError && (
                <p role="alert" className="caption text-red-500 mt-2 text-center">
                  {serverError}
                </p>
              )}
              <p className="text-[10px] text-[#001416] mt-2 text-center leading-[1.4]">
                {t.form.recaptchaNotice.map((seg, i) =>
                  "href" in seg && seg.href ? (
                    <a
                      key={i}
                      href={seg.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[#018293]"
                    >
                      {seg.text}
                    </a>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
              </p>
            </>
          )}
        </div>
      </form>
      </div>

      <div className="flex flex-col gap-4 pt-4 text-left xl:pt-0 xl:flex-1 xl:min-w-0 xl:px-6 xl:border-l xl:border-[#63737D] xl:justify-center" aria-label="What happens next">
        <div className="relative hidden xl:block w-[213px] h-[73px]" aria-hidden="true">
          <Image src="/logo.svg" alt="Weather Recovery Solutions logo - Licensed Roofing Contractor in South Florida" fill className="object-contain object-left" />
        </div>

        <div>
          <p className="body-small font-[700] text-[#018293]">{t.form.whatHappensNext}</p>
          <ul className="list-disc pl-5 body-small text-[#001416]">
            {t.form.nextSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-1">
          <p className="body-small font-[700] text-[#018293]">{t.form.bbbLabel}</p>
          <a
            href="https://www.bbb.org/us/fl/deerfield-beach/profile/roofing-contractors/weather-recovery-solutions-0633-92026462"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.form.bbbLabel}
            data-track-location="form-trust-badges"
            className="relative w-[147px] h-[65px] block"
          >
            <Image src="/bbb-badge.svg" alt="BBB A+ Rating for Weather Recovery Solutions Roofing" fill className="object-contain object-left" />
          </a>
        </div>

        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          <li><TrustRow icon="/icon-shield.svg" segments={t.form.trustLicensed} /></li>
          <li><TrustRow icon="/icon-clock.svg" text={t.form.trustEmergency} /></li>
        </ul>
      </div>
    </div>
  );
}

function TrustRow({ icon, text, segments }: { icon: string; text?: string; segments?: { text: string; bold?: boolean }[] }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[18px] h-[18px] flex-shrink-0" aria-hidden="true">
        <Image src={icon} alt="" fill className="object-contain" />
      </div>
      <span className="body-small text-[#001416]">
        {segments
          ? segments.map((seg, i) =>
              seg.bold ? (
                <strong key={i}>{seg.text}</strong>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )
          : text}
      </span>
    </div>
  );
}

function FormAssurance({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-4 h-4 flex-shrink-0" aria-hidden="true">
        <Image src="/icon-form-check.svg" alt="" fill className="object-contain" />
      </div>
      <span className="caption text-[#001416]">{text}</span>
    </div>
  );
}

/* ─── Site Header ─── */

const SITE_LOCALES: readonly Locale[] = ["en", "es", "pt"];

function localeHref(targetLocale: Locale, pathname: string) {
  const withoutLocale = pathname.replace(/^\/(en|es|pt)(?=\/|$)/, "") || "/";
  if (targetLocale === "en") return withoutLocale;
  return withoutLocale === "/" ? `/${targetLocale}` : `/${targetLocale}${withoutLocale}`;
}

function homeHref(locale: Locale) {
  return locale === "en" ? "/" : `/${locale}`;
}

export function FooterHomeLink({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  const pathname = usePathname() ?? "/";
  const href = homeHref(locale);

  return (
    <Link
      href={href}
      data-track-event="nav_click"
      data-track-target="home"
      data-track-location="footer"
      className="underline"
      onClick={(e) => {
        if (pathname === href) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      {children}
    </Link>
  );
}

function LangButton({
  code,
  locale,
  active,
  currentLocale,
  href,
}: {
  code: string;
  locale: Locale;
  active: boolean;
  currentLocale: Locale;
  href: string;
}) {
  return (
    <Link
      href={href}
      onClick={() => {
        if (locale !== currentLocale) {
          track("language_switch", {
            from_locale: currentLocale,
            to_locale: locale,
          });
        }
      }}
      className={`flex items-center justify-center w-[32px] h-[32px] md:w-[40px] md:h-[40px] border-2 xl:border-[2.75px] rounded-full caption-bold leading-none ${
        active
          ? "border-[#16A5AF] text-[#16A5AF]"
          : "border-[#9CA9B0] text-[#9CA9B0]"
      }`}
    >
      {code}
    </Link>
  );
}

export function SiteHeader() {
  const { locale, t } = useLocale();
  const pathname = usePathname() ?? "/";
  const { stuck } = useStickyNav();

  return (
    <header
      data-stuck={stuck ? "true" : "false"}
      className="site-header fixed top-0 left-0 right-0 bg-[#001416] z-50 flex items-center h-[var(--header-height)] transition-[height] duration-200 ease-out"
    >
      <div className="w-full px-4 xl:px-[var(--site-margin)] flex items-center justify-between max-w-[var(--container-wide)] mx-auto">
        <Link
          href={homeHref(locale)}
          aria-label={t.nav.homeLinkAria}
          data-track-event="nav_click"
          data-track-target="logo-home"
          data-track-location="header"
          onClick={(e) => {
            if (pathname === homeHref(locale)) {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className={`relative block transition-[width,height] duration-200 ease-out ${
            stuck
              ? "w-[84px] h-[28px] md:w-[100px] md:h-[33px] xl:w-[128px] xl:h-[42px]"
              : "w-[94px] h-[31px] md:w-[123px] md:h-[41px] xl:w-[160px] xl:h-[53px]"
          }`}
        >
          <Image
            src="/wrs-logo-white.svg"
            alt="Weather Recovery Solutions logo - Licensed Roofing Contractor in South Florida"
            fill
            className="object-contain"
            priority
          />
        </Link>
        <nav aria-label="Contact and language">
          <div className="flex items-center gap-3 md:gap-12">
            <div
              aria-hidden={stuck ? "true" : undefined}
              className={`items-center gap-3 ml-1 transition-opacity duration-200 ease-out ${
                stuck
                  ? "hidden opacity-0 pointer-events-none md:flex"
                  : "flex opacity-100"
              }`}
            >
              {SITE_LOCALES.map((code) => (
                <LangButton
                  key={code}
                  code={code.toUpperCase()}
                  locale={code}
                  active={locale === code}
                  currentLocale={locale}
                  href={localeHref(code, pathname)}
                />
              ))}
            </div>
            <div className="flex flex-col items-end justify-center">
              <a
                href="tel:9549996600"
                data-track-location="header"
                className="whitespace-nowrap font-[700] text-[15px] tracking-wide text-[#E6F4F5] md:text-[18px] md:font-[800] md:leading-[1.32] md:tracking-normal transition-colors duration-200"
              >
                <span className={stuck ? "inline" : "hidden md:inline"}>
                  {t.nav.callNow}{" "}
                </span>
                (954) 999-6600
              </a>
              <span className="hidden md:block caption text-[#9CA9B0]">
                {t.nav.servingArea}
              </span>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
