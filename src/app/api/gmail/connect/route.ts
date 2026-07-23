import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { googleConfigured, gmailAuthUrl, baseUrlFromRequest } from "@/lib/google";

export const dynamic = "force-dynamic";

/** Start de Gmail-koppeling: stuurt de gebruiker naar Google's toestemming. */
export async function GET(req: Request) {
  const base = baseUrlFromRequest(req);
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${base}/login?callbackUrl=/koppelingen`);
  }
  if (!googleConfigured()) {
    return NextResponse.redirect(`${base}/koppelingen?gmail=nietgeconfigureerd`);
  }

  const state = randomBytes(16).toString("base64url");
  const res = NextResponse.redirect(gmailAuthUrl(state, base));
  res.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
