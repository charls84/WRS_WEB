import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import { LocaleProvider } from "@/i18n";
import { isValidLocale, type Locale } from "@/i18n/locales";
import { AnalyticsListener } from "@/components/AnalyticsListener";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import { pt } from "@/i18n/pt";
import type { Translations } from "@/i18n/en";
import { getReviews } from "@/lib/reviews-server";
import "../globals.css";

export const revalidate = 3600;

const SITE_URL = "https://weatherrecoverysolutions.com";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

const translations: Record<Locale, Translations> = { en, es, pt };

/* ─── Fonts ─── */

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

/* ─── Static params ─── */

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }, { locale: "pt" }];
}

/* ─── Dynamic metadata with hreflang ─── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const t = translations[locale];

  return {
    title: t.meta.title,
    description: t.meta.description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: locale === "en" ? SITE_URL : `${SITE_URL}/${locale}`,
      languages: {
        en: SITE_URL,
        es: `${SITE_URL}/es`,
        pt: `${SITE_URL}/pt`,
        "x-default": SITE_URL,
      },
    },
    openGraph: {
      title: t.meta.ogTitle,
      description: t.meta.ogDescription,
      type: "website",
      locale: t.meta.ogLocale,
      siteName: "Weather Recovery Solutions",
      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: t.meta.ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.ogTitle,
      description: t.meta.ogDescription,
      images: [`${SITE_URL}/og-image.jpg`],
    },
    ...(GOOGLE_SITE_VERIFICATION && {
      verification: { google: GOOGLE_SITE_VERIFICATION },
    }),
  };
}

/* ─── JSON-LD builder ─── */

function buildJsonLd(locale: Locale, t: Translations, reviewCount: number) {
  const localeUrl = locale === "en" ? SITE_URL : `${SITE_URL}/${locale}`;

  const serviceQAs = t.services.cards.map((card) => ({
    "@type": "Question" as const,
    name: card.qaQuestion,
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: card.qaAnswer,
    },
  }));

  const faqQAs = t.faq.items.map((item) => ({
    "@type": "Question" as const,
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: item.answer,
    },
  }));

  const orgId = `${SITE_URL}/#organization`;
  const localBusinessId = `${SITE_URL}/#localbusiness`;
  const webSiteId = `${SITE_URL}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: "Weather Recovery Solutions",
        legalName: "Weather Recovery Solutions LLC",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/wrs-logo-112.png`,
          width: 112,
          height: 112,
        },
        sameAs: [
          "https://www.facebook.com/p/Weather-Recovery-Solutions-100083397018388/",
          "https://www.instagram.com/weather_recovery_solutions/",
          "https://www.bbb.org/us/fl/deerfield-beach/profile/roofing-contractors/weather-recovery-solutions-0633-92026462",
          "https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=CCC1328244",
          "https://www.google.com/search?q=Weather+Recovery+Solutions&ludocid=14961817454941913706&lsig=AB86z5XN-mE8O1K0Y9P3V9J6Qz2a",
        ],
        subOrganization: { "@id": localBusinessId },
      },
      {
        "@type": "RoofingContractor",
        "@id": localBusinessId,
        name: "Weather Recovery Solutions",
        description: t.meta.businessDescription,
        url: localeUrl,
        telephone: "+19549996600",
        priceRange: "$$",
        image: `${SITE_URL}/wrs-logo-white.svg`,
        parentOrganization: { "@id": orgId },
        address: {
          "@type": "PostalAddress",
          streetAddress: "968 S Deerfield Ave",
          addressLocality: "Deerfield Beach",
          addressRegion: "FL",
          postalCode: "33441",
          addressCountry: "US",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 26.3052,
          longitude: -80.1034,
        },
        openingHoursSpecification: [
          ...[
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
          ].map((day) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: day,
            opens: "08:00",
            closes: "18:00",
          })),
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: "Saturday",
            opens: "08:00",
            closes: "14:00",
          },
        ],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "5",
          reviewCount: String(reviewCount),
          bestRating: "5",
        },
        review: t.reviews.items.map((r) => ({
          "@type": "Review",
          reviewRating: {
            "@type": "Rating",
            ratingValue: "5",
            bestRating: "5",
          },
          author: {
            "@type": "Person",
            name: r.authorName,
          },
          reviewBody: r.text.replace(/["\u201C\u201D]/g, ""),
        })),
        areaServed: [
          {
            "@type": "City",
            name: "Deerfield Beach",
            sameAs: "https://www.wikidata.org/entity/Q980655",
          },
          {
            "@type": "City",
            name: "Pompano Beach",
            sameAs: "https://www.wikidata.org/entity/Q988931",
          },
          {
            "@type": "City",
            name: "Coconut Creek",
            sameAs: "https://www.wikidata.org/entity/Q754267",
          },
          {
            "@type": "City",
            name: "Boca Raton",
            sameAs: "https://www.wikidata.org/entity/Q494755",
          },
          {
            "@type": "City",
            name: "Delray Beach",
            sameAs: "https://www.wikidata.org/entity/Q754350",
          },
          {
            "@type": "AdministrativeArea",
            name: "Broward County",
            sameAs: "https://www.wikidata.org/entity/Q488470",
          },
          {
            "@type": "AdministrativeArea",
            name: "Palm Beach County",
            sameAs: "https://www.wikidata.org/entity/Q490073",
          },
        ],
        knowsAbout: [
          "Roof repair",
          "Roof replacement",
          "Emergency roof repair",
          "Storm damage repair",
          "Shingle roofing",
          "Tile roofing",
          "Metal roofing",
          "Flat roofing",
          "Florida Building Code compliance",
          "High-Velocity Hurricane Zone roofing",
          "Insurance claim documentation",
          "Roof leak detection",
          "Secondary water barrier installation",
          "Roof inspection",
          "Coastal flashing repair",
          "Preventative roof maintenance",
          "Thermal imaging leak detection",
          "Roof permitting",
          "PACE financing for roofing",
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Roofing Services",
          itemListElement: t.services.cards.map((card) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: card.title,
              description: card.qaAnswer,
              areaServed: "Deerfield Beach, FL",
              provider: { "@id": localBusinessId },
            },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": webSiteId,
        url: SITE_URL,
        name: "Weather Recovery Solutions",
        publisher: { "@id": orgId },
        inLanguage: ["en", "es", "pt"],
      },
      {
        "@type": "FAQPage",
        "@id": `${localeUrl}/#faq`,
        mainEntity: [...serviceQAs, ...faqQAs],
      },
      {
        "@type": "WebPage",
        "@id": `${localeUrl}/#webpage`,
        url: localeUrl,
        name: t.meta.title,
        inLanguage: locale,
        about: { "@id": localBusinessId },
        isPartOf: { "@id": webSiteId },
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [
            "h1",
            "[data-speakable='aeo-capsule']",
            "[data-speakable='hero-sub']",
          ],
        },
      },
    ],
  };
}

/* ─── Layout ─── */

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const t = translations[locale];
  const { count: reviewCount, rating: reviewRating } = await getReviews();
  const jsonLd = buildJsonLd(locale, t, reviewCount);

  return (
    <html
      lang={locale}
      className={`${jakarta.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {GTM_ID && (
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <LocaleProvider locale={locale} reviewCount={reviewCount} reviewRating={reviewRating}>
          <AnalyticsListener />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
