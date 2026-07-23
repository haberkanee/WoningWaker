import { randomBytes } from "node:crypto";
import type { Verdeelmodel, WoningType } from "@prisma/client";
import type { NormalizedListing } from "@/lib/connectors/types";
import { herkenVerdeelmodel } from "@/lib/domain/verdeelmodellen";

/** Genormaliseerde inkomende e-mail (ongeacht provider). */
export interface InboundEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Deel na de '+' in het ontvangeradres (het gebruikerstoken). */
  mailboxHash?: string;
}

/** Genereer een uniek, URL-veilig inbound-token. */
export function nieuwInboundToken(): string {
  return randomBytes(9).toString("base64url"); // ~12 tekens
}

// ─── Provider-payloads normaliseren ────────────────────────────────────────

/** Postmark inbound webhook (JSON). */
export function vanPostmark(p: Record<string, unknown>): InboundEmail {
  const fromFull = p.FromFull as { Email?: string } | undefined;
  const toFull = (p.ToFull as { Email?: string }[] | undefined)?.[0];
  return {
    from: fromFull?.Email ?? String(p.From ?? ""),
    to: toFull?.Email ?? String(p.OriginalRecipient ?? p.To ?? ""),
    subject: String(p.Subject ?? ""),
    text: String(p.TextBody ?? ""),
    html: String(p.HtmlBody ?? ""),
    mailboxHash: (p.MailboxHash as string) || undefined,
  };
}

/** Generiek JSON-formaat (from,to,subject,text,html). */
export function vanGeneriek(p: Record<string, unknown>): InboundEmail {
  const to = String(p.to ?? p.recipient ?? p.To ?? "");
  return {
    from: String(p.from ?? p.sender ?? p.From ?? ""),
    to,
    subject: String(p.subject ?? p.Subject ?? ""),
    text: String(p.text ?? p["body-plain"] ?? p.TextBody ?? ""),
    html: String(p.html ?? p["body-html"] ?? p.HtmlBody ?? ""),
    mailboxHash: tokenUitAdres(to),
  };
}

/** Haalt het +token uit een adres als de provider geen aparte hash geeft. */
export function tokenUitAdres(adres: string): string | undefined {
  const m = /\+([^@]+)@/.exec(adres);
  return m?.[1];
}

// ─── Platformherkenning op afzender/URL-domein ─────────────────────────────

interface PlatformInfo {
  slug: string;
  naam: string;
  regio: string | null;
}

const PLATFORM_DOMEINEN: { patroon: RegExp; info: PlatformInfo }[] = [
  { patroon: /woonnetrijnmond\.nl/i, info: { slug: "rijnmond", naam: "Woonnet Rijnmond", regio: "rotterdam" } },
  { patroon: /mijndak\.nl|woonkeus/i, info: { slug: "dak", naam: "Mijn DAK (Woonkeus Drechtsteden)", regio: "drechtsteden" } },
  { patroon: /woonmatchnhn\.nl/i, info: { slug: "woonmatch", naam: "Woonmatch NHN", regio: "noord-holland-noord" } },
  { patroon: /hureninhollandrijnland\.nl/i, info: { slug: "hollandrijnland", naam: "Huren in Holland Rijnland", regio: "holland-rijnland" } },
];

function herkenPlatform(...bronnen: string[]): PlatformInfo {
  const tekst = bronnen.join(" ");
  for (const { patroon, info } of PLATFORM_DOMEINEN) {
    if (patroon.test(tekst)) return info;
  }
  return { slug: "email", naam: "E-mailalert", regio: null };
}

// ─── HTML-hulpjes ──────────────────────────────────────────────────────────

function htmlNaarTekst(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&euro;/gi, "€")
    .replace(/&amp;/gi, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function eersteLink(html: string, voorkeurDomein?: RegExp): string | null {
  const links = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const http = links.filter((l) => /^https?:\/\//i.test(l) && !/unsubscribe|afmelden|mailto:/i.test(l));
  if (voorkeurDomein) {
    const match = http.find((l) => voorkeurDomein.test(l));
    if (match) return match;
  }
  return http[0] ?? null;
}

function eersteFoto(html: string): string | null {
  const imgs = [...html.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi)];
  for (const m of imgs) {
    const src = m[1];
    if (!/^https?:\/\//i.test(src)) continue;
    // Sla trackers/logo's/pixels over
    if (/logo|icon|pixel|track|spacer|\.svg(\?|$)|width=1|1x1/i.test(m[0])) continue;
    return src;
  }
  return null;
}

// ─── Veldextractie ─────────────────────────────────────────────────────────

const TYPE_WOORDEN: [RegExp, WoningType][] = [
  [/eengezins/i, "EENGEZINSWONING"],
  [/appartement|etage/i, "APPARTEMENT"],
  [/studio/i, "STUDIO"],
  [/benedenwoning/i, "BENEDENWONING"],
  [/bovenwoning/i, "BOVENWONING"],
  [/senioren/i, "SENIORENWONING"],
  [/kamer\b/i, "KAMER"],
];

function detecteerType(tekst: string): WoningType {
  for (const [re, t] of TYPE_WOORDEN) if (re.test(tekst)) return t;
  return "ONBEKEND";
}

function getal(re: RegExp, tekst: string): number | null {
  const m = re.exec(tekst);
  if (!m) return null;
  const n = Number(m[1].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function idUitUrl(url: string): string {
  try {
    const u = new URL(url);
    const q = u.searchParams.get("id") ?? u.searchParams.get("ref") ?? u.searchParams.get("advertentie");
    if (q) return q;
    const seg = u.pathname.split("/").filter(Boolean).pop();
    if (seg && /\d/.test(seg)) return seg;
  } catch {
    /* ignore */
  }
  // Val terug op een korte hash van de URL
  return Buffer.from(url).toString("base64url").slice(0, 20);
}

/**
 * Parseert een doorgestuurde woningalert tot een genormaliseerde woning.
 * Retourneert null als er geen bruikbare advertentie in zit.
 */
export function parseAlertEmail(email: InboundEmail): NormalizedListing | null {
  const html = email.html ?? "";
  const tekst = (email.text && email.text.trim()) || htmlNaarTekst(html);
  const alles = `${email.subject}\n${tekst}`;

  const platform = herkenPlatform(email.from, html, tekst);
  const domeinRe = PLATFORM_DOMEINEN.find((d) => d.info.slug === platform.slug)?.patroon;

  const bronUrl = eersteLink(html, domeinRe) ?? eersteUrlInTekst(tekst);
  if (!bronUrl) return null; // zonder link geen bruikbare advertentie

  const prijs =
    getal(/(?:huur(?:prijs)?|kale huur)[^\d€]*€?\s*([\d.,]+)/i, alles) ??
    getal(/€\s*([\d.,]+)/, alles);

  const plaats = detecteerPlaats(alles, email.subject);
  const kamers = getal(/(\d+)\s*(?:-?\s*)?kamer/i, alles);
  const oppervlakte = getal(/(\d+)\s*m(?:²|2)(?![a-z0-9])/i, alles);
  const type = detecteerType(alles);
  const model: Verdeelmodel = herkenVerdeelmodel(alles);
  const sluitDatum = detecteerSluitdatum(alles);
  const fotoUrl = eersteFoto(html);

  const titel =
    schoon(email.subject) ||
    (plaats ? `Woning in ${plaats}` : "Woningaanbod");

  return {
    externalId: idUitUrl(bronUrl),
    bronUrl,
    plaats: plaats ?? "Onbekend",
    regio: platform.regio,
    huurprijs: prijs ?? 0,
    oppervlakte: oppervlakte ?? null,
    kamers: kamers ?? null,
    woningtype: type,
    verdeelmodel: model,
    gepubliceerdOp: new Date(),
    sluitDatum,
    titel,
    fotoUrl,
  };
}

export function platformVoorEmail(email: InboundEmail): PlatformInfo {
  return herkenPlatform(email.from, email.html ?? "", email.text ?? "");
}

// ── kleine helpers ──

function schoon(s: string): string {
  return s.replace(/^(fwd?|doorgestuurd|re):\s*/i, "").trim();
}

function eersteUrlInTekst(tekst: string): string | null {
  const m = /(https?:\/\/[^\s<>"')]+)/i.exec(tekst);
  return m ? m[1] : null;
}

const STEDEN = [
  "Rotterdam", "Schiedam", "Vlaardingen", "Capelle", "Spijkenisse", "Dordrecht",
  "Zwijndrecht", "Papendrecht", "Sliedrecht", "Alkmaar", "Heerhugowaard", "Den Helder",
  "Leiden", "Leiderdorp", "Oegstgeest", "Katwijk",
];

function detecteerPlaats(tekst: string, subject: string): string | null {
  const label = /(?:plaats|gemeente|woonplaats|te)\s*:?\s*([A-ZÀ-Þ][a-zà-þ'\- ]{2,30})/.exec(tekst);
  if (label) {
    const kandidaat = label[1].trim().split(/\s{2,}|\n/)[0].trim();
    if (kandidaat.length >= 3) return kandidaat;
  }
  for (const stad of STEDEN) {
    if (new RegExp(`\\b${stad}\\b`, "i").test(subject) || new RegExp(`\\b${stad}\\b`, "i").test(tekst)) {
      return stad;
    }
  }
  return null;
}

const MAAND_NL: Record<string, number> = {
  januari: 0, februari: 1, maart: 2, april: 3, mei: 4, juni: 5, juli: 6,
  augustus: 7, september: 8, oktober: 9, november: 10, december: 11,
};

function detecteerSluitdatum(tekst: string): Date | null {
  // "reageren tot 12 augustus 2026" of "sluit op 12-08-2026"
  const nl = /(?:reageren tot|sluit(?:ingsdatum)?(?: op)?|uiterlijk)\s*:?\s*(\d{1,2})\s+([a-z]+)\s*(\d{4})?/i.exec(tekst);
  if (nl && MAAND_NL[nl[2].toLowerCase()] != null) {
    const jaar = nl[3] ? Number(nl[3]) : new Date().getFullYear();
    return new Date(jaar, MAAND_NL[nl[2].toLowerCase()], Number(nl[1]), 23, 59);
  }
  const num = /(?:reageren tot|sluit(?:ingsdatum)?(?: op)?|uiterlijk)\s*:?\s*(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/i.exec(tekst);
  if (num) {
    const jaar = Number(num[3].length === 2 ? "20" + num[3] : num[3]);
    return new Date(jaar, Number(num[2]) - 1, Number(num[1]), 23, 59);
  }
  const rel = /(?:sluit|reageren)\s*(?:over)?\s*(\d+)\s*dag/i.exec(tekst);
  if (rel) return new Date(Date.now() + Number(rel[1]) * 86_400_000);
  return null;
}
