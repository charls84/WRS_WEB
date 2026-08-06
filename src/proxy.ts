import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "es", "pt"];

// URL patterns from the pre-2025 WordPress site (theme demo content).
// Served as 410 Gone so Google drops them from the index faster than a 404.
const goneUrlPatterns = [
  /^\/(2018|2019|2020)(\/|$)/,
  /^\/10-reason-why-roofing-are-factmake-easier(-\d+)?(\/|$)/,
  /^\/about(\/|$)/,
  /^\/blog(\/|$)/,
  /^\/category\//,
  /^\/tag\//,
  /^\/product(\/|$)/,
  /^\/projects(-cat)?(\/|$)/,
  /^\/services(-cat)?(\/|$)/,
  /^\/team(-cat)?(\/|$)/,
  /^\/shop(\/|$)/,
  /^\/cdn-cgi\//,
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (goneUrlPatterns.some((pattern) => pattern.test(pathname))) {
    return new NextResponse(
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Page removed</title></head><body><h1>410 &mdash; Page removed</h1><p>This page no longer exists. Visit <a href="https://weatherrecoverysolutions.com/">weatherrecoverysolutions.com</a>.</p></body></html>',
      {
        status: 410,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Robots-Tag": "noindex",
        },
      },
    );
  }

  // Check if pathname already starts with a supported locale
  const pathnameHasLocale = locales.some(
    (locale) =>
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Rewrite root and unlocalized paths to /en (keeps browser URL unchanged)
  request.nextUrl.pathname = `/en${pathname}`;
  return NextResponse.rewrite(request.nextUrl);
}

export const config = {
  matcher: [
    // Match all paths except static files, _next, API routes, and metadata files
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|llms.txt|llms-es.txt|llms-pt.txt|.*\\..*).*)",
  ],
};
