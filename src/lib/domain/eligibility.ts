import type { GeschiktheidStatus } from "@prisma/client";
import type {
  GeschiktheidResultaat,
  ListingInput,
  ProfielInput,
  Reden,
} from "./types";

/**
 * Geschiktheidscontrole — voldoet de gebruiker waarschijnlijk aan de formele
 * voorwaarden van de woning? Geeft een score (0-100), een status en per
 * gecontroleerde voorwaarde een uitleg.
 *
 * Statussen:
 *  - WAARSCHIJNLIJK_GESCHIKT       geen harde blokkade gevonden
 *  - HANDMATIGE_CONTROLE           informatie ontbreekt, niet te bepalen
 *  - WAARSCHIJNLIJK_NIET_GESCHIKT  minstens één harde voorwaarde niet gehaald
 */
export function beoordeelGeschiktheid(
  profiel: ProfielInput | null,
  listing: ListingInput,
): GeschiktheidResultaat {
  const redenen: Reden[] = [];
  let harteBlokkade = false;
  let ontbrekendeInfo = false;

  // ── Inkomen ───────────────────────────────────────────────────────────
  if (listing.maxInkomen != null) {
    if (profiel?.brutoJaarinkomen == null) {
      ontbrekendeInfo = true;
      redenen.push({ ok: "onbekend", tekst: "Inkomen onbekend — vul je bruto jaarinkomen in." });
    } else if (profiel.brutoJaarinkomen > listing.maxInkomen) {
      harteBlokkade = true;
      redenen.push({
        ok: "nee",
        tekst: `Je inkomen ligt boven de grens (max. ${listing.maxInkomen.toLocaleString("nl-NL")}).`,
      });
    } else {
      redenen.push({ ok: "ja", tekst: "Je inkomen valt binnen de inkomensgrens." });
    }
  }
  if (listing.minInkomen != null && profiel?.brutoJaarinkomen != null) {
    if (profiel.brutoJaarinkomen < listing.minInkomen) {
      harteBlokkade = true;
      redenen.push({
        ok: "nee",
        tekst: `Je inkomen ligt onder het minimum (min. ${listing.minInkomen.toLocaleString("nl-NL")}).`,
      });
    } else {
      redenen.push({ ok: "ja", tekst: "Je inkomen voldoet aan het minimum." });
    }
  }

  // ── Huishoudgrootte ───────────────────────────────────────────────────
  if (listing.maxHuishoudgrootte != null || listing.minHuishoudgrootte != null) {
    if (profiel?.huishoudgrootte == null) {
      ontbrekendeInfo = true;
      redenen.push({ ok: "onbekend", tekst: "Huishoudgrootte onbekend." });
    } else {
      const g = profiel.huishoudgrootte;
      if (listing.maxHuishoudgrootte != null && g > listing.maxHuishoudgrootte) {
        harteBlokkade = true;
        redenen.push({
          ok: "nee",
          tekst: `Huishouden te groot (max. ${listing.maxHuishoudgrootte} personen).`,
        });
      } else if (listing.minHuishoudgrootte != null && g < listing.minHuishoudgrootte) {
        harteBlokkade = true;
        redenen.push({
          ok: "nee",
          tekst: `Huishouden te klein (min. ${listing.minHuishoudgrootte} personen).`,
        });
      } else {
        redenen.push({ ok: "ja", tekst: "Huishoudgrootte past bij de woning." });
      }
    }
  }

  // ── Leeftijd / doelgroep ──────────────────────────────────────────────
  if (listing.minLeeftijd != null || listing.maxLeeftijd != null) {
    if (profiel?.leeftijd == null) {
      ontbrekendeInfo = true;
      redenen.push({ ok: "onbekend", tekst: "Leeftijd onbekend." });
    } else {
      const l = profiel.leeftijd;
      if (listing.minLeeftijd != null && l < listing.minLeeftijd) {
        harteBlokkade = true;
        redenen.push({ ok: "nee", tekst: `Je bent jonger dan de doelgroep (vanaf ${listing.minLeeftijd} jaar).` });
      } else if (listing.maxLeeftijd != null && l > listing.maxLeeftijd) {
        harteBlokkade = true;
        redenen.push({ ok: "nee", tekst: `Je bent ouder dan de doelgroep (tot ${listing.maxLeeftijd} jaar).` });
      } else {
        redenen.push({ ok: "ja", tekst: "Je valt binnen de leeftijdsgroep." });
      }
    }
  }

  // ── Regio-inschrijving ────────────────────────────────────────────────
  if (listing.regio) {
    const regios = profiel?.gewensteRegios ?? [];
    if (regios.length === 0) {
      ontbrekendeInfo = true;
      redenen.push({ ok: "onbekend", tekst: "Geen regio's ingesteld in je profiel." });
    } else if (regios.includes(listing.regio)) {
      redenen.push({ ok: "ja", tekst: `Je bent gericht op regio ${listing.regio}.` });
    } else {
      redenen.push({
        ok: "onbekend",
        tekst: `Woning ligt in ${listing.regio}, buiten je ingestelde regio's — controleer je inschrijving daar.`,
      });
      ontbrekendeInfo = true;
    }
  }

  // ── Lokale binding ────────────────────────────────────────────────────
  if (listing.lokaleBindingGemeente) {
    const binding = profiel?.lokaleBinding ?? [];
    if (binding.includes(listing.lokaleBindingGemeente)) {
      redenen.push({ ok: "ja", tekst: `Je hebt lokale binding met ${listing.lokaleBindingGemeente}.` });
    } else {
      redenen.push({
        ok: "onbekend",
        tekst: `Deze woning vraagt lokale binding met ${listing.lokaleBindingGemeente} — controleer of je hieraan voldoet.`,
      });
      ontbrekendeInfo = true;
    }
  }

  // ── Huurprijsgrens t.o.v. inkomen (indicatief passend toewijzen) ──────
  // Woningcorporaties wijzen "passend" toe: lage inkomens onder de aftoppingsgrens.
  if (profiel?.maxHuurprijs != null && listing.huurprijs > profiel.maxHuurprijs) {
    redenen.push({
      ok: "onbekend",
      tekst: `Huur (${listing.huurprijs}) ligt boven je zelf ingestelde maximum (${profiel.maxHuurprijs}).`,
    });
  }

  if (redenen.length === 0) {
    redenen.push({ ok: "onbekend", tekst: "Geen formele voorwaarden bekend bij deze woning." });
    ontbrekendeInfo = true;
  }

  // ── Status & score ────────────────────────────────────────────────────
  let status: GeschiktheidStatus;
  let score: number;
  if (harteBlokkade) {
    status = "WAARSCHIJNLIJK_NIET_GESCHIKT";
    score = scoreVanRedenen(redenen, 0, 35);
  } else if (ontbrekendeInfo) {
    status = "HANDMATIGE_CONTROLE";
    score = scoreVanRedenen(redenen, 45, 75);
  } else {
    status = "WAARSCHIJNLIJK_GESCHIKT";
    score = scoreVanRedenen(redenen, 80, 100);
  }

  return { score, status, redenen };
}

function scoreVanRedenen(redenen: Reden[], min: number, max: number): number {
  const relevant = redenen.length || 1;
  const ja = redenen.filter((r) => r.ok === "ja").length;
  const ratio = ja / relevant;
  return Math.round(min + (max - min) * ratio);
}
