export type Locale = "en" | "es" | "pt";

export const locales: Locale[] = ["en", "es", "pt"];

export function isValidLocale(value: string): value is Locale {
  return (locales as string[]).includes(value);
}
