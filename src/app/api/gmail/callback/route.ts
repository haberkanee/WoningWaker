import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCode, gmailEmailAddress } from "@/lib/google";
import { encrypt } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { APP_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Google stuurt de gebruiker hierheen terug; we bewaren de Gmail-toegang. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${APP_URL}/login?callbackUrl=/koppelingen`);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("gmail_oauth_state="))
    ?.split("=")[1];

  if (url.searchParams.get("error") || !code || !state || state !== cookieState) {
    return NextResponse.redirect(`${APP_URL}/koppelingen?gmail=mislukt`);
  }

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token) {
      // Geen refresh token (al eerder toestemming gegeven) → vraag opnieuw met prompt=consent.
      return NextResponse.redirect(`${APP_URL}/koppelingen?gmail=herhaal`);
    }
    const email = await gmailEmailAddress(tokens.access_token);
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        gmailRefreshToken: encrypt(tokens.refresh_token),
        gmailEmail: email,
        gmailConnectedAt: new Date(),
      },
    });
    await audit({ userId: session.user.id, actie: "gmail.gekoppeld", metadata: { email } });
  } catch {
    return NextResponse.redirect(`${APP_URL}/koppelingen?gmail=mislukt`);
  }

  const res = NextResponse.redirect(`${APP_URL}/koppelingen?gmail=verbonden`);
  res.cookies.delete("gmail_oauth_state");
  return res;
}
