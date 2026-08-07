import Image from "next/image";
import { Phone } from "lucide-react";
import { BenefitPoint, SiteFooter, renderBold } from "@/components/PageSections";
import { ContactForm, SiteHeader, FAQItem } from "@/components/PageSections.client";
import type { Translations, Locale } from "@/i18n";

const SITE_URL = "https://weatherrecoverysolutions.com";

const PROBLEM_ICONS = [
  "/icon-waterdrop.svg",
  "/icon-shingle.svg",
  "/icon-tile.svg",
  "/icon-vent.svg",
  "/icon-storm.svg",
  "/icon-emergency.svg",
];

function servicesAnchor(locale: Locale, slug: string) {
  const base = locale === "en" ? "/" : `/${locale}`;
  return `${base}#${slug}`;
}

export function RoofRepairDeerfieldBeachContent({
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
  const page = t.roofRepairDeerfieldBeach;
  const proofReview = t.reviews.items[2];

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Roof Repair",
    name: page.meta.title,
    description: page.meta.description,
    areaServed: {
      "@type": "City",
      name: "Deerfield Beach",
      containedInPlace: { "@type": "AdministrativeArea", name: "Broward County, FL" },
    },
    provider: {
      "@type": "RoofingContractor",
      name: "Weather Recovery Solutions",
      telephone: "+19549996600",
      address: {
        "@type": "PostalAddress",
        streetAddress: "968 S Deerfield Ave",
        addressLocality: "Deerfield Beach",
        addressRegion: "FL",
        postalCode: "33441",
        addressCountry: "US",
      },
    },
    url: `${SITE_URL}${locale === "en" ? "" : `/${locale}`}/roof-repair/deerfield-beach`,
  };

  return (
    <div className="font-jakarta min-h-screen bg-white flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <SiteHeader />

      <main className="pt-[65px] md:pt-[73px] xl:pt-[101px] flex-1">
        {/* ─── SECTION 1: HERO ─── */}
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="bg-[linear-gradient(180deg,#FFFFFF_0%,#E6F4F5_100%)]"
        >
          <div className="xl:flex xl:items-center xl:gap-6 xl:max-w-[1920px] xl:mx-auto">
            {/* Real repair photo — no carousel, no stock imagery */}
            <figure className="relative aspect-[4/3] md:aspect-video xl:aspect-square w-full xl:order-2 xl:flex-1 overflow-hidden bg-[#D0D6D9] m-0">
              <Image
                src="/images/services/m-the-roads-tile-roof-repair-1.webp"
                alt={page.hero.imageAlt}
                fill
                sizes="(min-width: 1280px) 0px, 100vw"
                className="object-cover xl:hidden"
                priority
                fetchPriority="high"
              />
              <Image
                src="/images/services/d-the-roads-tile-roof-repair-1.webp"
                alt={page.hero.imageAlt}
                fill
                sizes="(min-width: 1280px) 50vw, 0px"
                className="object-cover hidden xl:block"
                priority
                fetchPriority="high"
              />
            </figure>

            <div className="xl:order-1 xl:flex-1 xl:pl-[120px]">
              <div className="px-4 pt-8 pb-12 md:px-6 md:py-[var(--section-py)] space-y-8 md:max-w-[1200px] md:mx-auto xl:mx-0 xl:max-w-none xl:px-0 xl:py-0">
                <div className="space-y-3">
                  <p className="eyebrow text-[#018293]">{page.hero.eyebrow}</p>
                  <h1 id="hero-heading" className="text-[#001416]">
                    {page.hero.headline}
                  </h1>
                  <p className="body-regular text-[#001416]">{page.hero.subCopy}</p>
                  <div className="flex items-center gap-2">
                    <div className="relative w-[18px] h-[18px] flex-shrink-0" aria-hidden="true">
                      <Image src="/icon-shield.svg" alt="" fill className="object-contain" />
                    </div>
                    <p className="body-small text-[#001416]">
                      <span className="font-[700]">{page.hero.trustLine}</span>
                    </p>
                  </div>
                </div>

                {/* Single CTA — phone only (inspection CTA lives between Problems and Why-Us) */}
                <div aria-label="Schedule a roof inspection" className="w-full">
                  <div className="flex flex-col gap-2 items-center md:items-start md:max-w-[400px]">
                    <a
                      href="tel:9549996600"
                      aria-label="Call (954) 999-6600 to schedule your roof inspection"
                      data-track-location="hero"
                      className="btn-pill-primary w-full gap-1"
                    >
                      <Phone size={18} className="text-white" aria-hidden="true" />
                      {page.hero.ctaPrimary}
                    </a>
                    <p className="caption-bold text-[#001416] text-center md:text-left px-8 md:px-0">
                      {page.hero.ctaPrimaryNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 2: PROBLEMS WRS HANDLES ─── */}
        <section
          id="roof-problems"
          aria-labelledby="problems-heading"
          className="bg-white py-[var(--section-py)] px-[var(--site-margin)]"
        >
          <div className="space-y-8 xl:max-w-[var(--container-content)] xl:mx-auto">
            <header className="text-center space-y-[var(--gap-heading)] max-w-[var(--heading-block-max)] mx-auto">
              <h2 id="problems-heading" className="h2 text-[#001416]">
                {page.problems.heading}
              </h2>
              <p className="body-regular text-[#001416]">{page.problems.subheading}</p>
            </header>

            <div className="grid gap-4 xl:grid-cols-2 xl:gap-6">
              {page.problems.items.map((item, i) => (
                <BenefitPoint
                  key={i}
                  index={i + 1}
                  title={item.title}
                  body={[{ text: item.body }]}
                  icon={PROBLEM_ICONS[i]}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ─── INSPECTION CTA (between Problems and Why-Us) ─── */}
        <section
          id="inspection-cta"
          aria-label="Request a roof inspection"
          className="bg-white pb-[var(--section-py)] px-[var(--site-margin)] flex justify-center"
        >
          <a
            href="#inspection-form"
            data-track-location="roof-problems"
            data-track-label="Request a Roof Inspection"
            className="btn-pill-primary w-full max-w-[400px] text-center"
          >
            {page.hero.ctaSecondary}
          </a>
        </section>

        {/* ─── SECTION 3: WHY WRS + PROOF ─── */}
        <section
          id="why-wrs"
          aria-labelledby="why-wrs-heading"
          className="bg-[#E6F4F5] py-[var(--section-py)] px-[var(--site-margin)]"
        >
          <div className="space-y-8 xl:max-w-[var(--container-wide)] xl:mx-auto xl:flex xl:gap-10 xl:items-start xl:space-y-0">
            <div className="space-y-6 xl:flex-1 xl:min-w-0">
              <header className="space-y-[var(--gap-heading)]">
                <h2 id="why-wrs-heading" className="h2 text-[#001416]">
                  {page.whyUs.heading}
                </h2>
                <p className="body-regular text-[#001416]">{page.whyUs.body}</p>
              </header>

              <div className="space-y-4">
                {page.whyUs.points.map((point, i) => (
                  <BenefitPoint key={i} index={i + 1} title={point.title} body={point.body} />
                ))}
              </div>

              <p className="body-regular font-[700] text-[#001416]">
                {renderBold(page.whyUs.localTeamStatement)}
              </p>

              <a
                href="#inspection-form"
                data-track-location="why-wrs"
                data-track-label="Request My Roof Inspection"
                className="btn-pill-primary w-full block text-center md:w-auto md:inline-block"
              >
                {page.whyUs.ctaLabel}
              </a>
            </div>

            {/* Proof: looping background video + verified review overlaid on top */}
            <div className="relative aspect-[4/3] w-full rounded-[16px] overflow-hidden bg-[#D0D6D9] xl:aspect-[4/5] xl:rounded-[8px] xl:flex-1 xl:min-w-0 xl:max-w-[480px]">
              <video
                className="absolute inset-0 w-full h-full object-cover"
                src="/videos/why-us-proof-bg.mp4"
                poster="/images/process/d-sam-mike-process-1.webp"
                aria-hidden="true"
                autoPlay
                loop
                muted
                playsInline
              />
              {/* Slight blur on the video directly behind the text block */}
              <div className="absolute inset-0 backdrop-blur-[2px]" aria-hidden="true" />
              {/* 70% opaque dark layer between the video and the text */}
              <div className="absolute inset-0 bg-[#001416] opacity-70" aria-hidden="true" />

              <figure className="relative z-10 h-full flex flex-col justify-end gap-3 p-6 m-0">
                <div
                  aria-hidden="true"
                  className="body-regular font-bold text-[#FBBC04]"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
                >
                  ★★★★★
                </div>
                <blockquote
                  className="body-regular text-[#F3F3F3] m-0"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
                >
                  {proofReview.text}
                </blockquote>
                <figcaption
                  className="body-small text-[#F3F3F3]"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}
                >
                  — {proofReview.authorName}, {proofReview.authorLocation} · Google Review
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ─── SECTION 4: CONTACT + FAQ ─── */}
        <section
          id="inspection-form"
          aria-labelledby="contact-heading"
          className="py-[var(--section-py)] px-[var(--site-margin)] relative overflow-hidden"
          style={{
            backgroundImage: `url('/form-texture.webp'), linear-gradient(90deg, #01A2B7 0%, #01A2B7 100%)`,
            backgroundSize: "310px 482px, auto",
            backgroundPosition: "top left",
          }}
        >
          <div className="space-y-6 xl:max-w-[var(--container-content)] xl:mx-auto">
            <header className="text-center space-y-2 max-w-[var(--heading-block-max)] mx-auto">
              <h2 id="contact-heading" className="h2 text-white">
                {page.contact.heading}
              </h2>
              <p className="body-regular text-white">{page.contact.subCopy}</p>
            </header>

            <ContactForm />

            <p className="body-regular text-white text-center">
              {page.contact.phonePrefix}
              <a href="tel:9549996600" data-track-location="contact" className="font-[700] underline">
                {page.contact.phone}
              </a>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="roof-repair-faq"
          aria-labelledby="faq-heading"
          className="bg-white py-[var(--section-py)] px-[var(--site-margin)]"
        >
          <div className="max-w-[var(--heading-block-max)] mx-auto space-y-4">
            <header>
              <h2 id="faq-heading" className="h2 text-[#001416] text-center">
                {page.faq.heading}
              </h2>
            </header>
            <div className="divide-y divide-[#9CA9B0]">
              {page.faq.items.map((item, i) => (
                <FAQItem key={i} index={i + 1} question={item.question} answer={item.answer} />
              ))}
            </div>

            <footer className="pt-8 text-center space-y-4">
              <p className="h3 text-[#018293]">{page.faq.ctaHeading}</p>
              <p className="body-regular text-[#001416] max-w-[534px] mx-auto">
                <a href="tel:9549996600" data-track-location="roof-repair-faq" className="text-[#018293]">
                  {page.faq.ctaCallLabel}
                </a>{" "}
                {page.faq.ctaOrRequest}{" "}
                <a
                  href="#inspection-form"
                  data-track-location="roof-repair-faq"
                  data-track-label="free inspection"
                  className="text-[#018293]"
                >
                  {page.faq.ctaFreeInspection}
                </a>
              </p>
            </footer>

            {/* Contextual internal links (kept discreet, per brief) */}
            <nav aria-label="Related roofing services" className="pt-8 space-y-2 text-center caption text-[#001416]">
              <p>
                {page.links.replacementPrompt}{" "}
                <a
                  href={servicesAnchor(locale, "roof-replacement-deerfield")}
                  data-track-event="nav_click"
                  data-track-target="roof-replacement-deerfield"
                  data-track-location="roof-repair-faq"
                  className="text-[#018293] underline"
                >
                  {page.links.replacementCta}
                </a>
              </p>
              <p>
                {page.links.emergencyPrompt}{" "}
                <a
                  href={servicesAnchor(locale, "emergency-roof-repair-deerfield")}
                  data-track-event="nav_click"
                  data-track-target="emergency-roof-repair-deerfield"
                  data-track-location="roof-repair-faq"
                  className="text-[#018293] underline"
                >
                  {page.links.emergencyCta}
                </a>
              </p>
            </nav>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section
          id="final-cta"
          aria-labelledby="final-cta-heading"
          className="bg-[#001416] py-[var(--section-py)] px-[var(--site-margin)] flex flex-col items-center"
        >
          <div className="w-full flex flex-col items-center gap-6">
            <div className="flex justify-center" aria-hidden="true">
              <Image src="/graphic-inspection.svg" alt="" width={73} height={86} />
            </div>

            <h2 id="final-cta-heading" className="h2 text-[#E6F4F5] text-center max-w-[600px] text-balance">
              {page.finalCta.heading}
              {page.finalCta.headingLine2}
            </h2>

            <div className="max-w-[358px] w-full flex flex-col items-center gap-6">
            <p className="body-regular text-[#E6F4F5] text-center">{page.finalCta.body}</p>

            <div className="w-full space-y-2">
              <a
                href="#inspection-form"
                data-track-location="final-cta"
                data-track-label="Request My Roof Inspection"
                className="flex items-center justify-center w-full px-4 py-3 rounded-full bg-white border border-[#018293] text-[16px] font-[700] text-[#018293] tracking-[0.16px] leading-[1.5] text-center"
              >
                {page.finalCta.inspectionButton}
              </a>

              <div className="pt-4 space-y-2">
                <a
                  href="tel:9549996600"
                  data-track-location="final-cta"
                  className="flex items-center justify-center w-full px-4 py-3 rounded-full border border-[#63737D] text-[16px] font-[700] text-[#E6F4F5] tracking-[0.16px] leading-[1.5] text-center"
                >
                  {page.finalCta.callButton}
                </a>
                <p className="caption-bold text-[#63737D] text-center px-8">{page.finalCta.note}</p>
              </div>
            </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter
        locale={locale}
        t={t}
        reviewCount={reviewCount}
        reviewRating={reviewRating}
      />
    </div>
  );
}
