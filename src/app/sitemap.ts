import type { MetadataRoute } from "next";

const SITE_URL = "https://weatherrecoverysolutions.com";

const homeAlternates = {
  languages: {
    en: SITE_URL,
    es: `${SITE_URL}/es`,
    pt: `${SITE_URL}/pt`,
  },
};

const privacyAlternates = {
  languages: {
    en: `${SITE_URL}/privacy-policy`,
    es: `${SITE_URL}/es/privacy-policy`,
    pt: `${SITE_URL}/pt/privacy-policy`,
  },
};

const termsAlternates = {
  languages: {
    en: `${SITE_URL}/terms-of-service`,
    es: `${SITE_URL}/es/terms-of-service`,
    pt: `${SITE_URL}/pt/terms-of-service`,
  },
};

const roofRepairDeerfieldBeachAlternates = {
  languages: {
    en: `${SITE_URL}/roof-repair/deerfield-beach`,
    es: `${SITE_URL}/es/roof-repair/deerfield-beach`,
    pt: `${SITE_URL}/pt/roof-repair/deerfield-beach`,
  },
};

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE_URL,
      lastModified: now,
      alternates: homeAlternates,
    },
    {
      url: `${SITE_URL}/es`,
      lastModified: now,
      alternates: homeAlternates,
    },
    {
      url: `${SITE_URL}/pt`,
      lastModified: now,
      alternates: homeAlternates,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: now,
      alternates: privacyAlternates,
    },
    {
      url: `${SITE_URL}/es/privacy-policy`,
      lastModified: now,
      alternates: privacyAlternates,
    },
    {
      url: `${SITE_URL}/pt/privacy-policy`,
      lastModified: now,
      alternates: privacyAlternates,
    },
    {
      url: `${SITE_URL}/terms-of-service`,
      lastModified: now,
      alternates: termsAlternates,
    },
    {
      url: `${SITE_URL}/es/terms-of-service`,
      lastModified: now,
      alternates: termsAlternates,
    },
    {
      url: `${SITE_URL}/pt/terms-of-service`,
      lastModified: now,
      alternates: termsAlternates,
    },
    {
      url: `${SITE_URL}/roof-repair/deerfield-beach`,
      lastModified: now,
      alternates: roofRepairDeerfieldBeachAlternates,
    },
    {
      url: `${SITE_URL}/es/roof-repair/deerfield-beach`,
      lastModified: now,
      alternates: roofRepairDeerfieldBeachAlternates,
    },
    {
      url: `${SITE_URL}/pt/roof-repair/deerfield-beach`,
      lastModified: now,
      alternates: roofRepairDeerfieldBeachAlternates,
    },
  ];
}
