import { NextResponse, type NextRequest } from "next/server";

/**
 * Basic auth in front of the whole dashboard: it shows client business data.
 * Set DASHBOARD_PASSWORD (and optionally DASHBOARD_USER) in Vercel. Without a
 * password the dashboard only opens in local development.
 */
export function proxy(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("Dashboard locked: set DASHBOARD_PASSWORD.", { status: 503 });
  }
  const user = process.env.DASHBOARD_USER ?? "wrs";
  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const [u, ...rest] = atob(header.slice(6)).split(":");
    if (u === user && rest.join(":") === password) return NextResponse.next();
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="WRS dashboard", charset="UTF-8"' },
  });
}

export const config = {
  // The cron route checks its own secret.
  matcher: ["/((?!api/cron|_next/static|_next/image|favicon.ico).*)"],
};
