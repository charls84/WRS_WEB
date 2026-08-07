import Image from "next/image";
import Link from "next/link";
import { formatWithCount, pickByRating } from "@/lib/reviews";
import type { Translations, Locale } from "@/i18n";
import { FooterHomeLink } from "./PageSections.client";

/* ─── Helpers ─── */
/** Parses **bold** markers in i18n strings into <strong> tags */
export function renderBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

/* ─── Service Card ─── */
export function ServiceCard({
  slug,
  index = 0,
  title,
  subtitle,
  qaQuestion,
  qaAnswer,
  body,
  bestFor,
  bestForLabel,
  servicesLabel,
  whatToExpectLabel,
  services,
  whatToExpect,
  calloutEyebrow,
  calloutQuestion,
  calloutAnswer,
  imageMobile,
  imageDesktop,
  imageAltMobile,
  imageAltDesktop,
}: {
  slug: string;
  index?: number;
  title: string;
  subtitle: string;
  qaQuestion: string;
  qaAnswer: string;
  body: string;
  bestFor: string;
  bestForLabel: string;
  servicesLabel: string;
  whatToExpectLabel: string;
  services: { name: string; description: string }[];
  whatToExpect: string;
  calloutEyebrow: string;
  calloutQuestion: string;
  calloutAnswer: string;
  imageMobile: string;
  imageDesktop: string;
  imageAltMobile: string;
  imageAltDesktop: string;
}) {
  const imageFirstAtXl = index % 2 === 1;
  const titleId = `${slug}-title`;

  const callout = () => (
    <p className="body-small text-[#001416]">
      <strong>{calloutEyebrow}:</strong> {calloutQuestion} {calloutAnswer}
    </p>
  );

  return (
    <section id={slug} aria-labelledby={titleId} className="space-y-0 xl:py-8">
      <div
        className={`xl:flex xl:gap-6 xl:items-start ${
          imageFirstAtXl ? "xl:flex-row" : "xl:flex-row-reverse"
        }`}
      >
        {/* Image + Callout column (at xl) */}
        <div className="xl:flex-1 xl:min-w-0">
          <div className="relative aspect-[4/3] w-full rounded-[16px] overflow-hidden bg-[#D0D6D9] xl:aspect-[4/5] xl:rounded-[8px]">
            <Image
              src={imageMobile}
              alt={imageAltMobile}
              fill
              sizes="(min-width: 1280px) 0px, 100vw"
              className="object-cover xl:hidden"
            />
            <Image
              src={imageDesktop}
              alt={imageAltDesktop}
              fill
              sizes="(min-width: 1280px) 50vw, 0px"
              className="object-cover hidden xl:block"
            />
          </div>

          {/* Callout — xl only, lives in image column */}
          <div className="knowledge-callout hidden xl:block max-w-[534px] mt-4">
            {callout()}
          </div>
        </div>

        {/* Text column */}
        <div className="space-y-0 xl:flex-1 xl:min-w-0">
          <div className="pt-6 xl:pt-0">
            <h2 id={titleId} className="h2 text-[#001416] capitalize">
              {title}
            </h2>
            <p className="body-regular text-[#001416]">
              {subtitle}
            </p>
          </div>

          {/* Q&A Block */}
          <div className="py-8 space-y-3 border-b border-[var(--divider-color)]">
            <h3 className="h3 text-[#018293]">
              {qaQuestion}
            </h3>
            <div>
              <p className="body-regular text-[#001416]">
                {renderBold(qaAnswer)}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="py-8 space-y-4 border-b border-[var(--divider-color)]">
            {body.split("\n\n").map((p, i, arr) => (
              <p
                key={i}
                className={
                  i === arr.length - 1
                    ? "body-large font-[700] text-[#018293] mt-4"
                    : "body-regular text-[#001416]"
                }
              >
                {p}
              </p>
            ))}
          </div>

          {/* Best for + Services */}
          <div className="py-8 space-y-4 border-b border-[var(--divider-color)]">
            <p className="body-regular text-[#001416]">
              <span className="font-[700]">{bestForLabel}</span>
              <br />
              {bestFor}
            </p>
            <div>
              <p className="body-regular font-[700] text-[#001416]">{servicesLabel}</p>
              <ul className="list-disc pl-6 body-regular" aria-label={`${title} services`}>
                {services.map((item, i) => (
                  <li key={i} className="text-[#018293] font-[500]">
                    <strong>{item.name}</strong>
                    <span className="text-[#001416]"> {item.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* What to expect */}
          <div className="py-8 xl:border-b xl:border-[var(--divider-color)]">
            <p className="body-regular text-[#001416]">
              <span className="font-[700]">{whatToExpectLabel}</span>
              <br />
              {whatToExpect.includes("\n\n") ? (
                <>
                  {whatToExpect.split("\n\n")[0]}
                  <br /><br />
                  <span className="italic text-[#001416]">{whatToExpect.split("\n\n")[1]}</span>
                </>
              ) : (
                whatToExpect
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Divider + Callout (mobile/tablet) — below 2-column at xl this is hidden */}
      <div className="w-full h-[2px] bg-[#D0D6D9] xl:hidden" />
      <div className="knowledge-callout xl:hidden mt-6">
        {callout()}
      </div>
    </section>
  );
}

/* ─── Process Step ─── */
export function ProcessStep({
  number,
  title,
  body,
  showDivider,
}: {
  number: number;
  title: string;
  body: string;
  showDivider?: boolean;
}) {
  const headingId = `step-${number}-heading`;
  return (
    <li className="flex flex-col">
      {showDivider && <div className="w-full h-px bg-[#9CA9B0] mb-4" />}
      <div role="region" aria-labelledby={headingId} className="flex gap-4 p-4">
        <div className="w-8 h-8 rounded-full bg-[#018293] flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <span className="text-[20px] font-[800] text-white leading-none">{number}</span>
        </div>
        <div className="space-y-2">
          <h3 id={headingId} className="h3 text-[#001416]">{title}</h3>
          <p className="body-regular text-[#001416]">{body}</p>
        </div>
      </div>
    </li>
  );
}

/* ─── Benefit Point ─── */
export function BenefitPoint({
  index,
  title,
  body,
  icon = "/icon-checkmark-circle.svg",
}: {
  index: number;
  title: string;
  body: { text: string; bold?: boolean }[];
  icon?: string;
}) {
  const titleId = `benefit-${index}-title`;
  return (
    <section
      aria-labelledby={titleId}
      className="bg-[#E6F4F5] flex items-start px-4 py-6 xl:p-6 rounded-[8px]"
    >
      <div className="flex flex-col gap-3 flex-1">
        <div className="w-[34px] h-[34px]" aria-hidden="true">
          <Image src={icon} alt="" width={34} height={34} />
        </div>
        <h3
          id={titleId}
          className="h3 text-[#001416]"
        >
          {title}
        </h3>
        <p className="body-regular text-[#001416]">
          {body.map((segment, i) =>
            segment.bold ? (
              <strong key={i}>{segment.text}</strong>
            ) : (
              <span key={i}>{segment.text}</span>
            )
          )}
        </p>
      </div>
    </section>
  );
}

/* ─── Reviews Section (static, no carousel) ─── */
export function ReviewsSection({ t }: { t: Translations }) {
  return (
    <div className="max-w-[340px] md:max-w-[640px] mx-auto">
      {/* Header */}
      <header className="text-center px-4 py-2">
        <div role="img" aria-label="5 out of 5 stars">
          <span aria-hidden="true" className="body-regular font-bold text-[#FBBC04]">★★★★★</span>
        </div>
        <h2 id="reviews-heading" className="mt-6 body-regular font-bold text-[#16A5AF]">
          {t.reviews.headerLabel}
        </h2>
        <p className="caption text-[#FBBC04] mt-2">
          {t.reviews.headerSub}
        </p>
      </header>

      {/* Reviews */}
      <div className="mt-[var(--gap-content)]">
        {t.reviews.items.map((review, i) => {
          const titleId = `review-${i}-title`;
          return (
            <article
              key={i}
              role="region"
              aria-labelledby={titleId}
              className="py-8 px-4 space-y-4"
            >
              <h3 id={titleId} className="sr-only">
                {t.reviews.reviewByLabel.replace("{name}", review.authorName)}
              </h3>
              <blockquote className="h3 text-white">
                {review.text}
              </blockquote>
              <footer className="body-regular text-[#9BA8AF]">
                — <span>{review.authorName}</span>,{' '}
                <strong>{review.authorLocation}</strong>
              </footer>
            </article>
          );
        })}
      </div>

      {/* CTA */}
      <footer className="mt-[var(--gap-container)] py-[var(--gap-heading)] px-4 space-y-[var(--gap-heading)] text-center">
        <p className="h3 text-[#16A5AF]">
          {t.reviews.ctaHeading}
        </p>
        <a
          href="tel:9549996600"
          data-track-location="reviews"
          className="block h3 text-white"
          aria-label="Call Weather Recovery Solutions at 954-999-6600"
        >
          {t.reviews.ctaPhone}
        </a>
      </footer>
    </div>
  );
}

/* ─── Gallery Project ─── */
export function GalleryProject({
  title,
  metadata,
  description,
  review,
  dragLabel,
  beforeAfterLabel,
  scheduleLabel,
  seeHowLabel,
}: {
  title: string;
  metadata: string;
  description: string;
  review: string;
  dragLabel: string;
  beforeAfterLabel: string;
  scheduleLabel: string;
  seeHowLabel: string;
}) {
  return (
    <article className="space-y-0 xl:flex xl:flex-row-reverse xl:gap-10 xl:items-start">
      {/* Before/After Slider Placeholder */}
      <figure className="relative aspect-[4/3] md:aspect-[3/2] w-full rounded-[16px] overflow-hidden bg-[#D0D6D9] m-0 xl:flex-1 xl:min-w-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="bg-[#001416] text-white caption px-2 py-1 rounded">
              {dragLabel}
            </div>
            <div className="bg-[#F3F3F3] text-[#001416] caption px-2 py-1 rounded">
              {beforeAfterLabel}
            </div>
          </div>
        </div>
        <figcaption className="sr-only">Before and after roof repair comparison</figcaption>
      </figure>

      {/* Text Block */}
      <div className="py-6 space-y-4 md:space-y-6 xl:flex-1 xl:min-w-0 xl:py-4">
        <h3 className="h3 text-[#001416]">{title}</h3>
        <p className="body-small text-[#001416]">{metadata}</p>
        <p className="body-small text-[#001416]">{description}</p>

        <blockquote className="body-small text-[#001416]">
          <p>{review}</p>
        </blockquote>

        <div className="pt-2 space-y-6 xl:max-w-[358px]">
          <details className="group">
            <summary className="list-none cursor-pointer w-full bg-white border border-[#63737D] text-[#001416] font-bold py-2 px-4 rounded-full text-[12px] text-center flex items-center justify-center">
              {seeHowLabel}
            </summary>
            {/* Expandable project details — Phase 2 */}
          </details>

          <a href="#inspection-form" className="block w-full bg-[#001416] text-white font-bold py-2 rounded-full text-[12px] text-center" aria-label="Schedule your roof inspection">
            {scheduleLabel}
          </a>
        </div>
      </div>
    </article>
  );
}

/* ─── Site Footer ─── */

function privacyHref(locale: Locale) {
  return locale === "en" ? "/privacy-policy" : `/${locale}/privacy-policy`;
}

function termsHref(locale: Locale) {
  return locale === "en" ? "/terms-of-service" : `/${locale}/terms-of-service`;
}

export function SiteFooter({
  locale,
  t,
  reviewCount,
  reviewRating,
}: {
  locale: Locale;
  t: Translations;
  reviewCount: number;
  reviewRating: number | null;
}) {
  const trustSignalIcons = [
    "/icon-reviews.svg",
    "/icon-shield.svg",
    "/icon-clock.svg",
  ];

  return (
    <footer
      id="main-footer"
      className="bg-[#0F5C63] py-[var(--section-py)] px-[var(--site-margin)] flex flex-col items-center"
    >
      <div className="max-w-[var(--container-content)] w-full flex flex-col gap-8">
        {/* Row 1: Logo+trust (left) + CTA/Address (right) at desktop */}
        <div className="flex flex-col gap-8 xl:grid xl:grid-cols-2 xl:gap-x-8 xl:gap-y-0 xl:items-end pb-6 border-b border-[#16A5AF]">
          {/* Logo + tagline + trust signals */}
          <div className="flex flex-col gap-4 items-center xl:items-start">
            <div className="flex justify-center xl:justify-start py-2">
              <div className="relative w-[212px] h-[70px]">
                <Image
                  src="/wrs-logo-white.svg"
                  alt="Weather Recovery Solutions logo - Licensed Roofing Contractor in South Florida"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <p className="body-small text-[#F3F3F3] text-center xl:text-left">
              {t.footer.tagline}
            </p>

            <p className="caption-bold text-[#9CA9B0] text-center xl:text-left">
              {t.footer.neighborhoods}
            </p>

            <ul className="flex flex-col gap-1 list-none p-0 m-0 w-full">
              {t.footer.trustSignals.map((signal, i) => {
                const text =
                  i === 0
                    ? formatWithCount(
                        pickByRating(
                          reviewRating,
                          signal,
                          t.footer.trustSignalsFirstGeneric,
                        ),
                        reviewCount,
                      )
                    : signal;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <div className="relative w-[18px] h-[18px] flex-shrink-0" aria-hidden="true">
                      <Image src={trustSignalIcons[i]} alt="" fill className="object-contain" />
                    </div>
                    <span className="body-small text-white">{text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* CTA + Address */}
          <div className="flex flex-col gap-6 items-center xl:items-end">
            <div className="flex flex-col gap-1 items-center xl:items-end w-full">
              <p className="body-regular font-[700] text-white text-center xl:text-right">
                {t.footer.ctaHeading}
              </p>
              <div className="py-2">
                <a
                  href="tel:9549996600"
                  data-track-location="footer"
                  className="flex items-center justify-center px-4 py-3 rounded-full bg-[#001416] text-[16px] font-[700] text-white tracking-[0.16px] leading-[1.5]"
                >
                  {t.footer.ctaPhone}
                </a>
              </div>
              <p className="caption-bold text-[#9CA9B0] text-center xl:text-right">
                {t.footer.ctaNote}
              </p>
            </div>

            <div className="flex flex-col gap-2 items-center xl:items-end w-full">
              <p className="body-regular font-[700] text-white text-center xl:text-right">
                Weather Recovery Solutions
              </p>
              <address className="not-italic body-regular text-white text-center xl:text-right">
                <a
                  href="https://maps.app.goo.gl/z4T2c9RZpC6bXdQt9"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track-location="footer"
                  className="hover:underline"
                  aria-label="Open 968 S Deerfield Ave, Deerfield Beach, FL 33441 in Google Maps"
                >
                  968 S Deerfield Ave,<br />
                  Deerfield Beach,{" "}
                  FL{" "}
                  33441
                </a>
              </address>
            </div>
          </div>
        </div>

        {/* Row 2: Social + Copyright (social sits above on mobile, right on desktop) */}
        <div className="flex flex-col gap-4 items-center xl:grid xl:grid-cols-2 xl:gap-8 xl:items-center">
          <nav
            aria-label="Social media"
            className="flex justify-center xl:justify-end gap-4 order-1 xl:order-2"
          >
            <a
              href="https://www.facebook.com/p/Weather-Recovery-Solutions-100083397018388/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Weather Recovery Solutions on Facebook"
              data-track-location="footer"
            >
              <Image src="/icon-facebook.svg" alt="" width={45} height={41} />
            </a>
            <a
              href="https://www.instagram.com/weather_recovery_solutions/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Weather Recovery Solutions on Instagram"
              data-track-location="footer"
            >
              <Image src="/icon-instagram.svg" alt="" width={42} height={42} />
            </a>
          </nav>

          <div className="flex flex-col gap-2 items-center xl:items-start order-2 xl:order-1">
            <p className="caption text-[#9CA9B0] text-center xl:text-left">
              {t.footer.copyright}
            </p>
            <nav aria-label="Footer links" className="caption text-[#9CA9B0] text-center xl:text-left">
              <FooterHomeLink>{t.footer.linkHome}</FooterHomeLink>
              <span className="mx-1">{" • "}</span>
              <Link
                href={privacyHref(locale)}
                data-track-event="nav_click"
                data-track-target="privacy"
                data-track-location="footer"
                className="underline"
              >
                {t.footer.linkPrivacy}
              </Link>
              <span className="mx-1">{" • "}</span>
              <Link
                href={termsHref(locale)}
                data-track-event="nav_click"
                data-track-target="terms"
                data-track-location="footer"
                className="underline"
              >
                {t.footer.linkTerms}
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
