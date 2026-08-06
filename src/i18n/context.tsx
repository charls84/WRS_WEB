"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { en } from "./en";
import { es } from "./es";
import { pt } from "./pt";
import type { Translations } from "./en";
import type { Locale } from "./locales";
import { MIN_REVIEW_COUNT } from "@/lib/reviews";

const translations: Record<Locale, Translations> = { en, es, pt };

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
  reviewCount: number;
  reviewRating: number | null;
}>({
  locale: "en",
  setLocale: () => {},
  t: en,
  reviewCount: MIN_REVIEW_COUNT,
  reviewRating: null,
});

export function LocaleProvider({
  locale,
  reviewCount,
  reviewRating,
  children,
}: {
  locale: Locale;
  reviewCount: number;
  reviewRating: number | null;
  children: ReactNode;
}) {
  const router = useRouter();

  const setLocale = useCallback(
    (newLocale: Locale) => {
      const path = newLocale === "en" ? "/" : `/${newLocale}`;
      router.push(path);
    },
    [router],
  );

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t: translations[locale], reviewCount, reviewRating }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
