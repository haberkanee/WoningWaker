import type { Verdeelmodel } from "@prisma/client";
import type { ConnectorResult, NormalizedListing, PlatformConnector } from "./types";
import { herkenVerdeelmodel } from "@/lib/domain/verdeelmodellen";

/**
 * E-mailconnector — veel woningplatforms sturen officiële e-mailalerts. Deze
 * connector parseert zulke alert-mails (die de gebruiker naar een uniek
 * WoningWaker-adres doorstuurt) tot genormaliseerde woningen.
 *
 * MVP: een eenvoudige regex-parser met een voorbeeldmail als testdata. In
 * productie voedt een inbound-webhook (bv. Resend/Postmark) de `parseEmail`.
 */
export interface InboundEmail {
  subject: string;
  text: string;
  from: string;
  receivedAt: Date;
}

const VOORBEELD_MAIL: InboundEmail = {
  from: "no-reply@woonkeus-demo.nl",
  subject: "Nieuw woningaanbod: Leiden",
  receivedAt: new Date(),
  text: [
    "Nieuw in het aanbod:",
    "Woning: 2-kamerappartement Leiden Noord",
    "Plaats: Leiden",
    "Huurprijs: 648",
    "Oppervlakte: 55",
    "Kamers: 2",
    "Model: loting",
    "Sluit: 2 dagen",
    "Link: https://www.hureninhollandrijnland.nl/?ref=4001",
  ].join("\n"),
};

function veld(text: string, label: string): string | undefined {
  const m = new RegExp(`${label}\\s*:\\s*(.+)`, "i").exec(text);
  return m?.[1]?.trim();
}

export function parseEmail(email: InboundEmail): NormalizedListing | null {
  const link = veld(email.text, "Link");
  const prijs = veld(email.text, "Huurprijs");
  const plaats = veld(email.text, "Plaats");
  if (!link || !prijs || !plaats) return null;

  const model: Verdeelmodel = herkenVerdeelmodel(
    veld(email.text, "Model") ?? email.text,
  );
  const sluitTekst = veld(email.text, "Sluit");
  let sluitDatum: Date | null = null;
  const dagenM = sluitTekst && /(\d+)\s*dag/.exec(sluitTekst);
  if (dagenM) sluitDatum = new Date(Date.now() + Number(dagenM[1]) * 86_400_000);

  return {
    externalId: `email-${Buffer.from(link).toString("base64url").slice(0, 24)}`,
    bronUrl: link,
    plaats,
    regio: veld(email.text, "Regio") ?? null,
    huurprijs: Number(prijs.replace(/[^\d]/g, "")),
    oppervlakte: veld(email.text, "Oppervlakte") ? Number(veld(email.text, "Oppervlakte")) : null,
    kamers: veld(email.text, "Kamers") ? Number(veld(email.text, "Kamers")) : null,
    verdeelmodel: model,
    gepubliceerdOp: email.receivedAt,
    sluitDatum,
    titel: veld(email.text, "Woning") ?? email.subject,
  };
}

export function createEmailConnector(mails: InboundEmail[] = [VOORBEELD_MAIL]): PlatformConnector {
  return {
    slug: "email",
    naam: "E-mailalerts",
    bron: "email",
    regios: [],
    async fetchListings(): Promise<ConnectorResult> {
      const listings = mails
        .map(parseEmail)
        .filter((l): l is NormalizedListing => l !== null);
      return { listings, gezond: true };
    },
  };
}

export const emailConnector = createEmailConnector();
