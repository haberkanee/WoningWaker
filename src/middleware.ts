import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lichte middleware: beschermde routes vereisen een sessiecookie. De echte
 * autorisatie (rol/plan) gebeurt server-side in de pagina's via requireUser/
 * requireAdmin — dit voorkomt alleen onnodige renders van beschermde pagina's.
 */
const BESCHERMD = [
  "/dashboard", "/woningen", "/zoekprofielen", "/zoekpunten",
  "/inschrijvingen", "/woningklaar", "/reactielogboek", "/meldingen",
  "/profiel", "/instellingen", "/admin",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isBeschermd = BESCHERMD.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isBeschermd) return NextResponse.next();

  const heeftSessie =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  if (!heeftSessie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/woningen/:path*", "/zoekprofielen/:path*",
    "/zoekpunten/:path*", "/inschrijvingen/:path*", "/woningklaar/:path*",
    "/reactielogboek/:path*", "/meldingen/:path*", "/profiel/:path*",
    "/instellingen/:path*", "/admin/:path*",
  ],
};
