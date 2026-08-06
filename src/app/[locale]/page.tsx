import Image from "next/image";
import { Phone } from "lucide-react";
import {
  ServiceCard,
  ProcessStep,
  BenefitPoint,
  ReviewsSection,
  GalleryProject,
  SiteFooter,
  renderBold,
} from "@/components/PageSections";
import {
  HeroCarousel,
  ContactForm,
  SiteHeader,
  FAQItem,
  type HeroSlide,
} from "@/components/PageSections.client";
import { JumpNav, StickyNavProvider } from "@/components/JumpNav";
import { isValidLocale, type Locale, type Translations } from "@/i18n";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import { pt } from "@/i18n/pt";
import { getReviews } from "@/lib/reviews-server";
import { formatWithCount, pickByRating } from "@/lib/reviews";
import { notFound } from "next/navigation";

const translations: Record<Locale, Translations> = { en, es, pt };

const TRUST_ICONS = [
  "/icon-reviews.svg",
  "/icon-shield.svg",
  "/icon-veteran.svg",
  "/icon-emergency.svg",
  "/icon-location.svg",
];

const ABOUT_TRUST_ICONS = [
  "/icon-reviews.svg",
  "/icon-shield.svg",
  "/icon-veteran.svg",
  "/icon-emergency.svg",
  "/icon-location.svg",
  "/icon-location.svg",
];

const HERO_SLIDES: HeroSlide[] = [
  {
    mobile: "/images/hero/m-lake-worth-roof-replacement-1.webp",
    tablet: "/images/hero/t-lake-worth-roof-replacement-1.webp",
    desktop: "/images/hero/d-lake-worth-roof-replacement-1.webp",
    alt: "Custom tile roof replacement in Lake Worth, FL, featuring Florida Building Code compliant underlayment by Weather Recovery Solutions.",
    caption: "Lake Worth, FL – Tile Roof Replacement",
  },
  {
    mobile: "/images/hero/m-boynton-beach-shingle-roof-replacement-1.webp",
    tablet: "/images/hero/t-boynton-beach-shingle-roof-replacement-1.webp",
    desktop: "/images/hero/d-boynton-beach-shingle-roof-replacement-1.webp",
    alt: "Architectural shingle roof replacement by Weather Recovery Solutions for a residential home in Boynton Beach, FL.",
    caption: "Boynton Beach, FL – Shingle Roof Replacement",
  },
  {
    mobile: "/images/hero/m-pompano-beach-metal-roof-replacement-1.webp",
    tablet: "/images/hero/t-pompano-beach-metal-roof-replacement-1.webp",
    desktop: "/images/hero/d-pompano-beach-metal-roof-replacement-1.webp",
    alt: "Weather Recovery Solutions team completing a standing seam metal roof replacement in Pompano Beach, FL",
    caption: "Pompano Beach, FL – Metal Roof Replacement",
  },
];

const SERVICE_IMAGES: Record<string, { mobile: string; desktop: string; altMobile: string; altDesktop: string }> = {
  "roof-repair-deerfield": {
    mobile: "/images/services/m-the-roads-tile-roof-repair-1.webp",
    desktop: "/images/services/d-the-roads-tile-roof-repair-1.webp",
    altMobile: "Weather Recovery Solutions performing a precision tile roof repair in The Roads neighborhood of Miami-Dade County, ensuring compliance with High-Velocity Hurricane Zone (HVHZ) standards.",
    altDesktop: "Weather Recovery Solutions performing a precision tile roof repair in The Roads neighborhood of Miami-Dade County, ensuring compliance with High-Velocity Hurricane Zone (HVHZ) standards.",
  },
  "roof-replacement-deerfield": {
    mobile: "/images/services/m-delray-beach-shingle-roof-replacement-1.webp",
    desktop: "/images/services/d-delray-beach-shingle-roof-replacement-1.webp",
    altMobile: "Weather Recovery Solutions team performing a full architectural shingle roof replacement in the Las Verdes community of Delray Beach, Palm Beach County.",
    altDesktop: "Weather Recovery Solutions team performing a full architectural shingle roof replacement in the Las Verdes community of Delray Beach, Palm Beach County.",
  },
  "emergency-roof-repair-deerfield": {
    mobile: "/images/services/m-emergency-repair-service-truck-south-florida-1.webp",
    desktop: "/images/services/d-emergency-repair-owner-sam-medina-1.webp",
    altMobile: "Weather Recovery Solutions service truck equipped for emergency roof tarping and inspections in South Florida.",
    altDesktop: "Weather Recovery Solutions owner Sam Medina providing an emergency roof inspection and storm damage consultation for a local homeowner.",
  },
};

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const t = translations[locale];
  const { count: reviewCount, rating: reviewRating } = await getReviews();

  return (
    <div className="font-jakarta min-h-screen bg-white">
      <StickyNavProvider>
      <SiteHeader />

      <main className="pt-[var(--header-height)] transition-[padding] duration-200 ease-out">
        {/* ─── SECTION: HERO ─── */}
        <section
          id="hero"
          aria-label="Weather Recovery Solutions — Roof Repair & Replacement in Deerfield Beach, Serving Broward and Palm Beach"
          className="bg-[linear-gradient(180deg,#FFFFFF_0%,#E6F4F5_100%)]"
        >
          <div className="xl:flex xl:items-center xl:gap-6 xl:max-w-[1920px] xl:mx-auto">
            {/* Hero carousel (mobile/tablet figure + desktop figure synced) */}
            <HeroCarousel slides={HERO_SLIDES} />

            {/* Hero Content */}
            <div className="xl:order-1 xl:flex-1 xl:pl-[120px]">
              <div className="px-4 pt-8 pb-16 md:px-6 md:py-[var(--section-py)] space-y-8 md:max-w-[1200px] md:mx-auto xl:mx-0 xl:max-w-none xl:px-0 xl:py-0">
                {/* HeadingBlock + Social */}
                <div className="space-y-3">
                  {/* Social Proof */}
                  <div className="flex items-center gap-2" aria-label={formatWithCount(pickByRating(reviewRating, t.hero.socialProofAria, t.hero.socialProofAriaGeneric), reviewCount)}>
                    <div className="relative w-[14px] h-[14px]">
                      <Image src="/google-g.svg" alt="Google" fill className="object-contain" />
                    </div>
                    <div className="flex gap-[2px]" role="img" aria-label="5 out of 5 stars">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="relative w-[15px] h-[15px]">
                          <Image src="/google-star.svg" alt="" fill className="object-contain" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[12px] md:text-[14px] font-[500] text-[#001416]">
                      {formatWithCount(pickByRating(reviewRating, t.hero.socialProof, t.hero.socialProofGeneric), reviewCount)}
                    </span>
                  </div>

                  {/* Headline */}
                  <h1
                    id="hero-heading"
                    className="text-[#001416]"
                  >
                    {t.hero.headline}
                    <br />
                    <span className="h1-subtitle text-[#018293]">
                      {t.hero.headlineSub}
                    </span>
                  </h1>

                  {/* Sub-copy */}
                  <p data-speakable="hero-sub" className="body-regular text-[#001416]">
                    {t.hero.subCopy}
                  </p>
                </div>

                {/* CTAs */}
                <div aria-label="Schedule a roof inspection" className="w-full">
                  {/* Phone CTA — mobile only */}
                  <div className="flex flex-col gap-2 items-center md:hidden">
                    <a
                      href="tel:9549996600"
                      aria-label="Call (954) 999-6600 to schedule your roof inspection"
                      data-track-location="hero"
                      className="btn-pill-primary w-full gap-1"
                    >
                      <Phone size={18} className="text-white" aria-hidden="true" />
                      {t.hero.ctaPrimary}
                    </a>
                    <p className="caption-bold text-[#001416] text-center px-8">
                      {t.hero.ctaPrimaryNote}
                    </p>
                  </div>
                  {/* Form CTA — secondary style on mobile, primary on md+ */}
                  <div className="flex flex-col gap-2 items-center w-full pt-6 md:pt-0 md:max-w-[400px] md:mx-auto xl:mx-0">
                    <a
                      href="#inspection-form"
                      data-track-location="hero"
                      data-track-label="Request a Free Inspection"
                      className="btn-pill-secondary w-full md:hidden"
                    >
                      {t.hero.ctaSecondary}
                    </a>
                    <a
                      href="#inspection-form"
                      data-track-location="hero"
                      data-track-label="Request a Free Inspection"
                      className="btn-pill-primary w-full hidden md:flex"
                    >
                      {t.hero.ctaSecondary}
                    </a>
                    <p className="caption-bold text-[#001416] text-center w-full px-8 md:px-0">
                      <span className="md:hidden">{t.hero.ctaSecondaryNote}</span>
                      <span className="hidden md:inline">{t.hero.ctaPrimaryNote}</span>
                    </p>
                  </div>
                </div>

                {/* Trust Signals */}
                <ul aria-label="Business credentials" className="space-y-2 list-none p-0 m-0">
                  {t.hero.trust.map((item, i) => {
                    const resolved = i === 0 ? pickByRating(reviewRating, item, t.hero.trustFirstGeneric) : item;
                    return (
                      <li key={i}>
                        <TrustSignalRow icon={TRUST_ICONS[i]} bold={formatWithCount(resolved.bold, reviewCount)} regular={resolved.regular} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION: AEO ANSWER CAPSULE ─── */}
        <section
          id="aeo-answer-capsule"
          aria-labelledby="aeo-heading"
          className="bg-white py-6 px-4 border-b border-[var(--color-neutral-200)]"
        >
          <article
            className="flex gap-3 max-w-[340px] md:max-w-[680px] xl:max-w-[720px] mx-auto"
            data-speakable="aeo-capsule"
          >
            <div className="relative w-[26px] h-[26px] flex-shrink-0" aria-hidden="true">
              <Image src="/icon-waterdrop.svg" alt="" fill className="object-contain" />
            </div>
            <div>
              <h2
                id="aeo-heading"
                className="body-small font-[700] text-[#001416]"
              >
                {t.aeo.bold}
              </h2>
              <div className="caption text-[#001416]">
                <p>
                  {t.aeo.body.map((segment, i) =>
                    segment.bold ? (
                      <strong key={i}>{segment.text}</strong>
                    ) : (
                      <span key={i}>{segment.text}</span>
                    )
                  )}
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* ─── JUMP NAV (sticky scrollspy) ─── */}
        <JumpNav />

        {/* ─── SECTION: BENEFITS ─── */}
        <section
          id="benefits-authority"
          aria-labelledby="benefits-heading"
          className="bg-white py-[var(--section-py)] px-[var(--site-margin)]"
        >
          <div className="space-y-8 xl:max-w-[var(--container-content)] xl:mx-auto">
            <header className="px-4 text-center space-y-[var(--gap-heading)]">
              <h2
                id="benefits-heading"
                className="h2 text-[#001416] capitalize"
              >
                {t.benefits.heading}
              </h2>
              <p className="body-regular text-[var(--color-text-primary)]">
                {t.benefits.subheading}
              </p>
            </header>

            <div className="grid gap-4 px-2 xl:grid-cols-3 xl:gap-6 xl:px-0">
              {t.benefits.points.map((point, i) => (
                <BenefitPoint key={i} index={i + 1} title={point.title} body={point.body} />
              ))}
            </div>

            {/* Before You Hire callout */}
            <div className="knowledge-callout md:max-w-[358px] xl:max-w-[534px]">
              <p className="body-small text-[#001416]">
                <strong>{t.benefits.calloutEyebrow}:</strong> {t.benefits.calloutQuestion} {t.benefits.calloutAnswer}
              </p>
            </div>

            {/* CTA Block */}
            <div
              id="contact-trigger"
              aria-labelledby="benefits-cta-heading"
              className="flex flex-col gap-3 items-center text-center py-6"
            >
              <h2
                id="benefits-cta-heading"
                className="h3 text-[#001416]"
              >
                {t.benefits.ctaHeading}
              </h2>
              <a
                href="tel:9549996600"
                data-track-location="benefits"
                className="block h3 text-[#018293]"
                aria-label="Call Weather Recovery Solutions at 954-999-6600"
              >
                {t.benefits.ctaPhone}
              </a>
              <p className="body-regular text-[#001416]">
                {t.benefits.ctaSub}
              </p>
            </div>
          </div>
        </section>

        {/* ─── SECTION: FORM ─── */}
        <section
          id="inspection-form"
          aria-labelledby="form-heading"
          className="py-[var(--section-py)] px-[var(--site-margin)] relative overflow-hidden"
          style={{
            backgroundImage: `url('/form-texture.webp'), linear-gradient(90deg, #01A2B7 0%, #01A2B7 100%)`,
            backgroundSize: '310px 482px, auto',
            backgroundPosition: 'top left',
          }}
        >
          <div className="space-y-8 xl:max-w-[var(--container-content)] xl:mx-auto">
            <ContactForm />

            {/* Form Footer */}
            <footer className="space-y-2 text-center pt-4">
              <p className="h3 text-white">
                {t.form.footerHeading}
              </p>
              <a
                href="tel:9549996600"
                data-track-location="form-footer"
                className="block h3 text-[#001416]"
                aria-label="Call Weather Recovery Solutions at 954-999-6600"
              >
                {t.form.footerPhone}
              </a>
              <p className="body-regular text-[#001416]">
                {t.form.footerLanguages}
              </p>
            </footer>
          </div>
        </section>

        {/* ─── SECTION: REVIEWS ─── */}
        <section
          id="customer-reviews"
          aria-labelledby="reviews-heading"
          className="bg-[#001416] py-[var(--section-py)] px-[var(--site-margin)] text-white"
        >
          <ReviewsSection t={t} />
        </section>

        {/* ─── SECTION: SERVICES ─── */}
        <section
          id="services-hub"
          aria-labelledby="services-main-heading"
          className="bg-white py-[var(--section-py)] px-[var(--site-margin)] space-y-6 xl:max-w-[var(--container-wide)] xl:mx-auto"
        >
          <header className="space-y-[var(--gap-heading)] text-center max-w-[var(--heading-block-max)] mx-auto">
            <h2 id="services-main-heading" className="h2 text-[#001416] capitalize">
              {t.services.heading}
            </h2>
            <p className="body-large text-[#001416]">
              {t.services.subheading}
            </p>
          </header>

          <div className="space-y-16 xl:space-y-0">
            {t.services.cards.map((card, i) => {
              const img = SERVICE_IMAGES[card.slug];
              return (
                <ServiceCard
                  key={i}
                  slug={card.slug}
                  index={i}
                  title={card.title}
                  subtitle={card.subtitle}
                  qaQuestion={card.qaQuestion}
                  qaAnswer={card.qaAnswer}
                  body={card.body}
                  bestFor={card.bestFor}
                  bestForLabel={t.services.bestForLabel}
                  servicesLabel={t.services.servicesLabel}
                  whatToExpectLabel={t.services.whatToExpectLabel}
                  services={[...card.services]}
                  whatToExpect={card.whatToExpect}
                  calloutEyebrow={card.calloutEyebrow}
                  calloutQuestion={card.calloutQuestion}
                  calloutAnswer={card.calloutAnswer}
                  imageMobile={img.mobile}
                  imageDesktop={img.desktop}
                  imageAltMobile={img.altMobile}
                  imageAltDesktop={img.altDesktop}
                />
              );
            })}
          </div>

          {/* Services CTA */}
          <footer className="pt-8 space-y-4 text-center">
            <div className="flex justify-center">
              <Image
                src="/graphic-house-check.svg"
                alt=""
                width={106}
                height={51}
              />
            </div>
            <h3 className="h3 text-black">
              {t.services.ctaHeading}
            </h3>
            <p className="body-regular text-[#001416]">
              {t.services.ctaSubheading}
            </p>
            {/* Mobile-only: tel CTA */}
            <a
              href="tel:9549996600"
              data-track-location="services"
              className="md:hidden btn-pill-primary w-full gap-2"
              aria-label="Call Weather Recovery Solutions at 954-999-6600"
            >
              {t.services.ctaCallNow}
            </a>
            <p className="md:hidden caption-bold text-[#001416] text-center px-8">
              {t.services.ctaCallNote}
            </p>
            {/* Online inspection CTA — secondary on mobile, primary on md+ */}
            <a
              href="#inspection-form"
              data-track-location="services"
              data-track-label="Request Online Inspection"
              className="btn-pill-secondary md:!bg-[#001416] md:!text-white md:!border-0 md:hover:!bg-[#0a2e32] w-full md:max-w-[400px] md:mx-auto"
            >
              {t.services.ctaOnline}
            </a>
            <p className="caption-bold text-[#001416] text-center px-8 md:max-w-[400px] md:mx-auto">
              {t.services.ctaOnlineNote}
            </p>
          </footer>
        </section>

        {/* ─── SECTION: B&A GALLERY ─── */}
        <section id="recent-projects" aria-labelledby="gallery-heading" aria-hidden="true" className="hidden bg-[#E6F4F5] py-[var(--section-py)] px-[var(--site-margin)]">
          <div className="space-y-8 xl:max-w-[var(--container-wide)] xl:mx-auto">
            <header className="space-y-[var(--gap-heading)] text-center max-w-[var(--heading-block-max)] mx-auto">
              <p className="eyebrow">{t.gallery.eyebrow}</p>
              <h2 id="gallery-heading" className="h2 text-[#001416]">
                {t.gallery.heading}
                <br />
                {t.gallery.headingLine2}
              </h2>
              <p className="body-regular text-[#001416]">
                {renderBold(t.gallery.subheading)}
              </p>
            </header>

            <div className="space-y-12 xl:space-y-16 xl:pt-12">
              {t.gallery.projects.map((project, i) => (
                <GalleryProject
                  key={i}
                  title={project.title}
                  metadata={project.metadata}
                  description={project.description}
                  review={project.review}
                  dragLabel={t.gallery.dragToCompare}
                  beforeAfterLabel={t.gallery.beforeAfter}
                  scheduleLabel={t.gallery.scheduleInspection}
                  seeHowLabel={t.gallery.seeHow}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION: PROCESS ─── */}
        <section id="roofing-process" aria-labelledby="process-heading" className="bg-white py-[var(--section-py)] px-[var(--site-margin)] xl:max-w-[var(--container-wide)] xl:mx-auto">
          <div className="space-y-6 xl:flex xl:gap-6 xl:items-start xl:space-y-0">
            {/* Process image */}
            <div className="relative aspect-[4/3] xl:aspect-[4/5] w-full rounded-[16px] xl:rounded-[8px] overflow-hidden bg-[#D0D6D9] xl:flex-1 xl:min-w-0">
              <Image
                src="/images/process/m-sam-mike-process-1.webp"
                alt="Weather Recovery Solutions Mike and Sam on-site conducting an inspection of a flat roof in South Florida."
                fill
                sizes="(min-width: 1280px) 0px, 100vw"
                className="object-cover xl:hidden"
              />
              <Image
                src="/images/process/d-sam-mike-process-1.webp"
                alt="Weather Recovery Solutions Mike and Sam on-site conducting an inspection of a flat roof in South Florida."
                fill
                sizes="(min-width: 1280px) 50vw, 0px"
                className="object-cover hidden xl:block"
              />
            </div>

            <div className="space-y-6 xl:flex-1 xl:min-w-0 xl:max-w-[var(--container-content)]">
              <div className="space-y-6">
                <header className="space-y-[var(--gap-heading)] text-center xl:text-left">
                  <h2 id="process-heading" className="h2 text-[#001416]">
                    {t.process.heading}
                  </h2>
                  <p className="body-regular text-[#001416]">
                    {t.process.subheading}
                  </p>
                </header>

                <ol className="space-y-4" aria-label="Our 3-step roofing inspection process">
                  {t.process.steps.map((step, i) => (
                    <ProcessStep key={i} number={i + 1} title={step.title} body={step.body} showDivider={i > 0} />
                  ))}
                </ol>
              </div>

              {/* Process CTA */}
              <div className="pt-6 space-y-[var(--gap-heading)]">
                <h3 className="h3 text-[#001416] text-center">
                  {t.process.ctaHeading}
                </h3>
                <p className="body-regular text-[#001416] text-center xl:max-w-[534px] xl:mx-auto">
                  {t.process.ctaBody}
                </p>
                <a
                  href="#inspection-form"
                  data-track-location="process"
                  data-track-label="Request Your Free Inspection"
                  className="btn-pill-primary w-full block text-center xl:max-w-[358px] xl:mx-auto"
                  aria-label="Request your free roof inspection"
                >
                  {t.process.ctaButton}
                </a>
                <p className="caption-bold text-[#018293] text-center px-8">
                  {t.process.ctaNote}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION: FAQ ─── */}
        <section id="roofing-faq" aria-labelledby="faq-heading" className="bg-white py-[var(--section-py)] px-[var(--site-margin)] xl:max-w-[var(--container-wide)] xl:mx-auto">
          <div className="max-w-[var(--heading-block-max)] mx-auto space-y-4">
            <header>
              <h2 id="faq-heading" className="capitalize h2 text-[#001416] text-center">
                {t.faq.heading}
              </h2>
            </header>
            <div className="divide-y divide-[#9CA9B0]">
              {t.faq.items.map((item, i) => (
                <FAQItem key={i} index={i + 1} question={item.question} answer={item.answer} />
              ))}
            </div>

            {/* FAQ CTA */}
            <footer className="pt-8 text-center space-y-4">
              <p className="h3 text-[#018293]">
                {t.faq.ctaHeading}
              </p>
              <p className="body-regular text-[#001416] max-w-[534px] mx-auto">
                {t.faq.ctaBody}
                <br />
                <a
                  href="tel:9549996600"
                  data-track-location="faq"
                  className="text-[#018293]"
                >
                  {t.faq.ctaCallLabel}
                </a>{" "}
                {t.faq.ctaOrRequest}{" "}
                <a
                  href="#inspection-form"
                  data-track-location="faq"
                  data-track-label="free inspection"
                  className="text-[#018293]"
                >
                  {t.faq.ctaFreeInspection}
                </a>
              </p>
            </footer>
          </div>
        </section>

        {/* ─── SECTION: ABOUT ─── */}
        <section id="about-wrs" aria-labelledby="about-heading" className="bg-[#E6F4F5] py-[var(--section-py)] px-[var(--site-margin)]">
          <div className="space-y-6 xl:max-w-[var(--container-wide)] xl:mx-auto xl:flex xl:flex-row-reverse xl:gap-8 xl:items-center xl:space-y-0">
            {/* About image */}
            <div className="relative aspect-[3/2] xl:aspect-[4/5] w-full rounded-[8px] overflow-hidden bg-[#D0D6D9] xl:flex-1 xl:min-w-0">
              <Image
                src="/images/about/m-about-weather-recovery-solutions-1.webp"
                alt="Weather Recovery Solutions owners Sam and Andreia Medina attending a national roofing industry conference to stay updated on the latest Florida Building Code requirements and roofing technologies."
                fill
                sizes="(min-width: 1280px) 0px, 100vw"
                className="object-cover xl:hidden"
              />
              <Image
                src="/images/about/d-about-weather-recovery-solutions-1.webp"
                alt="Weather Recovery Solutions owners Sam and Andreia Medina attending a national roofing industry conference to stay updated on the latest Florida Building Code requirements and roofing technologies."
                fill
                sizes="(min-width: 1280px) 50vw, 0px"
                className="object-cover hidden xl:block"
              />
            </div>

            <div className="px-4 space-y-8 xl:flex-1 xl:min-w-0 xl:px-0">
              <div className="space-y-2">
                <p className="eyebrow text-[#018293]">
                  {t.about.eyebrow}
                </p>
                <h2 id="about-heading" className="capitalize h2 text-[#001416]">
                  {t.about.heading}
                </h2>
              </div>

              <article className="space-y-4 body-regular text-[#001416]">
                {t.about.paragraphs.map((p, i) => (
                  <p key={i}>{renderBold(p)}</p>
                ))}
                <p className="font-[700]">
                  {t.about.goalBold}
                </p>
              </article>

              <ul className="space-y-2 list-none p-0 m-0" aria-label="Company Credentials">
                {t.about.trust.map((text, i) => {
                  const resolved = i === 0 ? pickByRating(reviewRating, text, t.about.trustFirstGeneric) : text;
                  return (
                    <li key={i}>
                      <BenefitRow icon={ABOUT_TRUST_ICONS[i]} text={formatWithCount(resolved, reviewCount)} />
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* ─── SECTION: NAP (Name / Address / Phone) ─── */}
        {/* id="contact-section" is the scroll-spy target so the JumpNav stays
            on "Contact Us" while anywhere in this section; the click anchor
            (#contact-info) lives on the business-info block below the map. */}
        <section
          id="contact-section"
          aria-labelledby="contact-heading"
          className="bg-white py-[var(--section-py)] px-[var(--site-margin)] space-y-8 xl:max-w-[var(--container-wide)] xl:mx-auto"
        >
          {/* Heading block */}
          <header className="space-y-[var(--gap-heading)] md:max-w-[var(--heading-block-max)]">
            <h2
              id="contact-heading"
              className="capitalize h2 text-[#018293]"
            >
              {t.map.heading}
            </h2>
            <div className="body-regular text-[#001416] space-y-6">
              <p>{renderBold(t.map.intro1)}</p>
              <p>{t.map.intro2}</p>
            </div>
          </header>

          <div className="space-y-8 xl:flex xl:gap-8 xl:items-start xl:space-y-0 xl:py-6">
          {/* Google Map — business location */}
          <div
            role="region"
            aria-label="Location Map"
            className="relative aspect-video xl:aspect-[4/5] w-full rounded-[8px] overflow-hidden bg-[#D0D6D9] xl:flex-1 xl:min-w-0"
          >
            <iframe
              src="https://www.google.com/maps?q=Weather+Recovery+Solutions,+968+S+Deerfield+Ave,+Deerfield+Beach,+FL+33441&output=embed"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map showing ${t.map.businessName} in Deerfield Beach, Florida`}
            />
          </div>

          <div
            id="contact-info"
            role="region"
            aria-label="Contact Information and Hours"
            className="space-y-6 xl:flex-1 xl:min-w-0"
          >
            {/* Business identity */}
            <div className="space-y-2">
              <h3
                className="h3 text-[#001416]"
              >
                {t.map.businessName}
              </h3>
              <p className="body-regular text-[#001416]">
                {t.map.businessTagline}
              </p>
              <p className="body-regular font-[700] text-[#001416]">
                {t.map.businessLicensed}
              </p>
            </div>

            {/* Location */}
            <div className="flex gap-4 items-start">
              <div className="w-[26px] h-[26px] flex items-center justify-center flex-shrink-0">
                <Image src="/icon-pin.svg" alt="" width={16} height={20} />
              </div>
              <div className="body-regular text-[#001416]">
                <p className="font-[700]">{t.map.locationLabel}</p>
                <address className="not-italic">
                  <a
                    href="https://maps.app.goo.gl/z4T2c9RZpC6bXdQt9"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track-location="contact-info"
                    className="font-[500] text-[#018293] hover:underline"
                    aria-label={`Open ${t.map.streetAddress}, ${t.map.addressLocality}, ${t.map.addressRegion} ${t.map.postalCode} in Google Maps`}
                  >
                    {t.map.streetAddress},<br />
                    {t.map.addressLocality},{" "}
                    {t.map.addressRegion}{" "}
                    {t.map.postalCode}
                  </a>
                </address>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-4 items-start">
              <div className="w-[26px] h-[26px] flex items-center justify-center flex-shrink-0">
                <Image src="/icon-phone-outline.svg" alt="" width={20} height={20} />
              </div>
              <div>
                <p className="body-regular text-[#001416]">
                  <span className="font-[700]">{t.map.callUs}</span>
                  <br />
                  <a
                    href="tel:9549996600"
                    data-track-location="contact-info"
                    className="font-[500] text-[#018293] hover:underline"
                  >
                    {t.map.phone}
                  </a>
                </p>
                <p className="caption-bold text-[#001416] mt-1">
                  {t.map.phoneNote}
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-4 items-start">
              <div className="w-[26px] h-[26px] flex items-center justify-center flex-shrink-0">
                <Image src="/icon-clock-outline.svg" alt="" width={20} height={20} />
              </div>
              <div className="space-y-1">
                <p className="body-regular font-[700] text-[#001416]">{t.map.hoursLabel}</p>
                <table className="body-regular text-[#001416]">
                  <tbody>
                    {t.map.days.map(([day, hours], i) => {
                      const isoHours = [
                        ["08:00", "18:00"],
                        ["08:00", "18:00"],
                        ["08:00", "18:00"],
                        ["08:00", "18:00"],
                        ["08:00", "18:00"],
                        ["08:00", "14:00"],
                        null,
                      ];
                      const times = isoHours[i];
                      return (
                        <tr key={day}>
                          <td className="pr-4 w-[104px]">{day}</td>
                          <td>
                            {times ? (
                              <>
                                <time dateTime={times[0]}>{hours.split("–")[0].trim()}</time>
                                {" – "}
                                <time dateTime={times[1]}>{hours.split("–")[1].trim()}</time>
                              </>
                            ) : (
                              hours
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Emergency */}
            <div className="flex gap-4 items-center">
              <div className="w-[26px] h-[26px] flex-shrink-0" />
              <p className="body-regular text-[#018293]">
                {renderBold(t.map.emergencyNote)}
              </p>
            </div>

            {/* Areas we serve */}
            <div className="flex gap-4 items-start">
              <div className="w-[26px] h-[26px] flex-shrink-0" />
              <div className="caption text-[#001416]">
                <p className="font-[700]">{t.map.areasWeServeLabel}</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {t.map.areasWeServeList.map((area, i) => (
                    <li key={i}>{renderBold(area)}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AEO permitting hook */}
            <div className="knowledge-callout mt-4 xl:max-w-[534px]">
              <p className="body-small text-[#001416]">
                <strong>{t.map.calloutEyebrow}:</strong> {t.map.calloutQuestion} {t.map.calloutAnswer}
              </p>
            </div>
          </div>
          </div>
        </section>

        {/* ─── SECTION: FINAL CTA ─── */}
        <section
          id="final-cta"
          aria-labelledby="final-cta-heading"
          className="bg-[#001416] py-[var(--section-py)] px-[var(--site-margin)] flex flex-col items-center"
        >
          <div className="max-w-[358px] w-full flex flex-col items-center gap-6">
            <div className="flex justify-center" aria-hidden="true">
              <Image
                src="/graphic-inspection.svg"
                alt=""
                width={73}
                height={86}
              />
            </div>

            <h2
              id="final-cta-heading"
              className="capitalize h2 text-[#E6F4F5] text-center"
            >
              {t.finalCta.heading}
            </h2>

            <p className="body-regular text-[#E6F4F5] text-center">
              {t.finalCta.body}
            </p>

            <div className="w-full space-y-2">
              <a
                href="#inspection-form"
                data-track-location="final-cta"
                data-track-label="Schedule Your Free Inspection"
                className="flex items-center justify-center w-full px-4 py-3 rounded-full bg-white border border-[#018293] text-[16px] font-[700] text-[#018293] tracking-[0.16px] leading-[1.5] text-center"
              >
                {t.finalCta.inspectionButton}
              </a>

              <div className="pt-4 space-y-2">
                <a
                  href="tel:9549996600"
                  data-track-location="final-cta"
                  className="flex items-center justify-center w-full px-4 py-3 rounded-full border border-[#63737D] text-[16px] font-[700] text-[#E6F4F5] tracking-[0.16px] leading-[1.5] text-center"
                >
                  {t.finalCta.callButton}
                </a>
                <p className="caption-bold text-[#63737D] text-center px-8">
                  {t.finalCta.note}
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <SiteFooter locale={locale} t={t} reviewCount={reviewCount} reviewRating={reviewRating} />
      </StickyNavProvider>
    </div>
  );
}

function BenefitRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-5 h-5 flex-shrink-0">
        <Image src={icon} alt="" fill className="object-contain" />
      </div>
      <span className="body-small text-[#001416]">{renderBold(text)}</span>
    </div>
  );
}

function TrustSignalRow({ icon, bold, regular }: { icon: string; bold: string; regular: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[18px] h-[18px] flex-shrink-0">
        <Image src={icon} alt="" fill className="object-contain" />
      </div>
      <span className="body-small text-[#001416]">
        <span className="font-[700]">{bold}</span>
        <span className="font-[500]">{regular}</span>
      </span>
    </div>
  );
}
