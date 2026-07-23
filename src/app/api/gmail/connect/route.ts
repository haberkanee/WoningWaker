import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { googleConfigured, gmailAuthUrl } from "@/lib/google";
import { APP_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Start de Gmail-koppeling: stuurt de gebruiker naar Google's toestemming. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${APP_URL}/login?callbackUrl=/koppelingen`);
  }
  if (!googleConfigured()) {
    return NextResponse.redirect(`${APP_URL}/koppelingen?gmail=nietgeconfigureerd`);
  }

  const state = randomBytes(16).toString("base64url");
  const res = NextResponse.redirect(gmailAuthUrl(state));
  res.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
