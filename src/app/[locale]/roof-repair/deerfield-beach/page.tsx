import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/locales";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import { pt } from "@/i18n/pt";
import type { Translations } from "@/i18n/en";
import { getReviews } from "@/lib/reviews-server";
import { RoofRepairDeerfieldBeachContent } from "./content";

const SITE_URL = "https://weatherrecoverysolutions.com";
const PATH = "/roof-repair/deerfield-beach";

const translations: Record<Locale, Translations> = { en, es, pt };

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }, { locale: "pt" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const t = translations[locale];
  const { meta } = t.roofRepairDeerfieldBeach;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical:
        locale === "en"
          ? `${SITE_URL}${PATH}`
          : `${SITE_URL}/${locale}${PATH}`,
      languages: {
        en: `${SITE_URL}${PATH}`,
        es: `${SITE_URL}/es${PATH}`,
        pt: `${SITE_URL}/pt${PATH}`,
        "x-default": `${SITE_URL}${PATH}`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      locale: t.meta.ogLocale,
      siteName: "Weather Recovery Solutions",
    },
  };
}

export default async function RoofRepairDeerfieldBeachPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const t = translations[locale];
  const { count: reviewCount, rating: reviewRating } = await getReviews();

  return (
    <RoofRepairDeerfieldBeachContent
      locale={locale}
      t={t}
      reviewCount={reviewCount}
      reviewRating={reviewRating}
    />
  );
}
