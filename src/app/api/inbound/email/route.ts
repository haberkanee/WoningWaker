import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  vanPostmark, vanGeneriek, parseAlertEmail, platformVoorEmail, tokenUitAdres, type InboundEmail,
} from "@/lib/inbound";
import { upsertListing } from "@/lib/connectors/sync";
import { recomputeMatchesForUser } from "@/lib/matching";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Inbound-webhook voor doorgestuurde woningalerts. Providers (bv. Postmark)
 * posten hier de e-mail; wij parsen er een échte woning uit en koppelen die aan
 * de gebruiker via het +token in het ontvangeradres.
 *
 * Beveiliging: ?key=<INBOUND_WEBHOOK_SECRET> in de webhook-URL.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.INBOUND_WEBHOOK_SECRET;
  const key = url.searchParams.get("key");
  // Een fout gedeeld geheim wordt geweigerd; het persoonlijke token is de
  // eigenlijke sleutel (uniek en niet te raden), zodat de Gmail-methode zonder
  // gedeeld geheim werkt.
  if (secret && key && key !== secret) {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }
  const tokenParam = url.searchParams.get("token") ?? undefined;

  // Payload lezen (JSON van Postmark/generiek, of form-encoded).
  let email: InboundEmail | null = null;
  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      const body = (await req.json()) as Record<string, unknown>;
      email = "FromFull" in body || "TextBody" in body || "MailboxHash" in body
        ? vanPostmark(body)
        : vanGeneriek(body);
    } else {
      const form = await req.formData();
      const obj: Record<string, unknown> = {};
      form.forEach((v, k) => (obj[k] = typeof v === "string" ? v : ""));
      email = vanGeneriek(obj);
    }
  } catch {
    return NextResponse.json({ error: "Onleesbare payload" }, { status: 400 });
  }
  if (!email) return NextResponse.json({ error: "Geen e-mail" }, { status: 400 });

  // Gebruiker bepalen via het token (query > mailboxHash > +adres).
  const token = tokenParam || email.mailboxHash || tokenUitAdres(email.to);
  if (!token) return NextResponse.json({ error: "Geen token" }, { status: 202 });
  const user = await prisma.user.findUnique({ where: { inboundToken: token }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Onbekend token" }, { status: 202 });

  // Woning parsen.
  const woning = parseAlertEmail(email);
  if (!woning) {
    return NextResponse.json({ ok: true, verwerkt: false, reden: "geen advertentie gevonden" });
  }

  const platform = platformVoorEmail(email);
  await upsertListing(platform.slug, woning);
  await recomputeMatchesForUser(user.id).catch(() => {});

  await audit({
    userId: user.id,
    actie: "inbound.woning",
    entiteit: "Listing",
    metadata: { platform: platform.slug, plaats: woning.plaats },
  });

  return NextResponse.json({ ok: true, verwerkt: true, woning: woning.titel });
}
