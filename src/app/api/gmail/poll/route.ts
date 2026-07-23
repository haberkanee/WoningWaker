import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pollGmailForUser, pollAllGmail } from "@/lib/gmail-poll";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Haalt nieuwe woningalerts uit Gmail.
 * - Met CRON_SECRET (Bearer) of admin → alle gekoppelde gebruikers.
 * - Als ingelogde gebruiker → alleen je eigen Gmail (knop "Nu ophalen").
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const viaCron = secret && req.headers.get("authorization") === `Bearer ${secret}`;

  if (viaCron) {
    const res = await pollAllGmail();
    return NextResponse.json({ ok: true, ...res });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  if (session.user.role === "ADMIN" && new URL(req.url).searchParams.get("all") === "1") {
    const res = await pollAllGmail();
    return NextResponse.json({ ok: true, ...res });
  }
  const woningen = await pollGmailForUser(session.user.id);
  return NextResponse.json({ ok: true, woningen });
}

export async function POST(req: Request) {
  return handle(req);
}
export async function GET(req: Request) {
  return handle(req);
}
