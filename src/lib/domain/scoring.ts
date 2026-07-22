import type { Kansindicatie } from "@prisma/client";
import type {
  KansResultaat,
  ListingInput,
  MatchResultaat,
  ProfielInput,
  Reden,
  WoonwensResultaat,
} from "./types";
import { beoordeelGeschiktheid } from "./eligibility";
import { verdeelmodelInfo } from "./verdeelmodellen";

/**
 * Woonwensscore — hoe goed past de woning bij de persoonlijke voorkeuren?
 * Gewogen som van criteria die de gebruiker heeft ingevuld.
 */
export function beoordeelWoonwens(
  profiel: ProfielInput | null,
  listing: ListingInput,
): WoonwensResultaat {
  const redenen: Reden[] = [];
  const onderdelen: { gewicht: number; behaald: number }[] = [];

  const voegToe = (gewicht: number, behaald: number, reden: Reden) => {
    onderdelen.push({ gewicht, behaald });
    redenen.push(reden);
  };

  // Prijs (gewicht 3)
  if (profiel?.maxHuurprijs != null) {
    if (listing.huurprijs <= profiel.maxHuurprijs) {
      const marge = (profiel.maxHuurprijs - listing.huurprijs) / profiel.maxHuurprijs;
      voegToe(3, 1, { ok: "ja", tekst: `Huur ${listing.huurprijs} past ruim binnen je budget.` });
      if (marge > 0.15) redenen[redenen.length - 1].tekst = `Huur ${listing.huurprijs} ligt comfortabel onder je maximum.`;
    } else {
      voegToe(3, 0, { ok: "nee", tekst: `Huur ${listing.huurprijs} is hoger dan je maximum ${profiel.maxHuurprijs}.` });
    }
  }

  // Kamers (gewicht 2)
  if (profiel?.minKamers != null && listing.kamers != null) {
    if (listing.kamers >= profiel.minKamers) {
      voegToe(2, 1, { ok: "ja", tekst: `${listing.kamers} kamers voldoet aan je minimum van ${profiel.minKamers}.` });
    } else {
      voegToe(2, 0, { ok: "nee", tekst: `Slechts ${listing.kamers} kamers (je wilt minimaal ${profiel.minKamers}).` });
    }
  }

  // Woningtype (gewicht 2)
  if (profiel?.woningtypes && profiel.woningtypes.length > 0) {
    if (profiel.woningtypes.includes(listing.woningtype)) {
      voegToe(2, 1, { ok: "ja", tekst: `Woningtype ${labelType(listing.woningtype)} past bij je voorkeur.` });
    } else {
      voegToe(2, 0.3, { ok: "onbekend", tekst: `Woningtype ${labelType(listing.woningtype)} staat niet in je voorkeuren.` });
    }
  }

  // Regio/gemeente (gewicht 2)
  if (profiel?.gewensteGemeenten && profiel.gewensteGemeenten.length > 0 && listing.gemeente) {
    if (profiel.gewensteGemeenten.includes(listing.gemeente)) {
      voegToe(2, 1, { ok: "ja", tekst: `${listing.gemeente} staat in je gewenste gemeenten.` });
    } else {
      voegToe(2, 0.4, { ok: "onbekend", tekst: `${listing.gemeente} staat niet in je gewenste gemeenten.` });
    }
  } else if (profiel?.gewensteRegios && profiel.gewensteRegios.length > 0 && listing.regio) {
    voegToe(1, profiel.gewensteRegios.includes(listing.regio) ? 1 : 0.4, {
      ok: profiel.gewensteRegios.includes(listing.regio) ? "ja" : "onbekend",
      tekst: profiel.gewensteRegios.includes(listing.regio)
        ? `Regio ${listing.regio} past bij je zoekgebied.`
        : `Regio ${listing.regio} valt buiten je zoekgebied.`,
    });
  }

  // Lift / begane grond (gewicht 2)
  if (profiel?.liftVereist) {
    if (listing.heeftLift === true || listing.beganeGrond === true) {
      voegToe(2, 1, { ok: "ja", tekst: "Woning is gelijkvloers of heeft een lift." });
    } else if (listing.heeftLift === false && listing.beganeGrond === false) {
      voegToe(2, 0, { ok: "nee", tekst: "Geen lift en niet op de begane grond." });
    } else {
      voegToe(1, 0.5, { ok: "onbekend", tekst: "Lift/begane grond onbekend — controleer de advertentie." });
    }
  } else if (profiel?.beganeGrondVereist) {
    if (listing.beganeGrond === true) {
      voegToe(2, 1, { ok: "ja", tekst: "Woning is op de begane grond." });
    } else if (listing.beganeGrond === false) {
      voegToe(2, 0, { ok: "nee", tekst: "Woning is niet op de begane grond." });
    } else {
      voegToe(1, 0.5, { ok: "onbekend", tekst: "Begane grond onbekend." });
    }
  }

  const totaalGewicht = onderdelen.reduce((s, o) => s + o.gewicht, 0);
  const behaald = onderdelen.reduce((s, o) => s + o.gewicht * o.behaald, 0);
  const score = totaalGewicht === 0 ? 50 : Math.round((behaald / totaalGewicht) * 100);

  if (totaalGewicht === 0) {
    redenen.push({ ok: "onbekend", tekst: "Stel je woonwensen in voor een persoonlijke woonwensscore." });
  }

  return { score, redenen };
}

/**
 * Kansindicatie — hoe realistisch lijkt een uitnodiging? Heuristisch en
 * expliciet als indicatie gemarkeerd. Houdt rekening met verdeelmodel,
 * geschiktheid, huurniveau en (bij inschrijfduur) hoe lang je ingeschreven staat.
 */
export function beoordeelKans(
  profiel: ProfielInput | null,
  listing: ListingInput,
  geschiktScore: number,
  opties?: { inschrijfjaren?: number | null },
): KansResultaat {
  const redenen: Reden[] = [];
  const info = verdeelmodelInfo(listing.verdeelmodel);
  let punten = 0; // -3 .. +3

  // Geschiktheid als basis
  if (geschiktScore >= 80) {
    punten += 1;
    redenen.push({ ok: "ja", tekst: "Je voldoet waarschijnlijk aan de voorwaarden." });
  } else if (geschiktScore < 40) {
    punten -= 2;
    redenen.push({ ok: "nee", tekst: "Je voldoet waarschijnlijk niet aan de voorwaarden." });
  } else {
    redenen.push({ ok: "onbekend", tekst: "Geschiktheid nog onzeker — controleer voorwaarden." });
  }

  // Verdeelmodel-specifiek
  switch (listing.verdeelmodel) {
    case "LOTING":
      redenen.push({ ok: "onbekend", tekst: "Loting: iedereen maakt evenveel kans, uitkomst is toeval." });
      break;
    case "DIRECT_KANS":
    case "TIJDELIJKE_HUUR":
      punten += 1;
      redenen.push({ ok: "ja", tekst: `${info.label}: snel reageren vergroot je kans aanzienlijk.` });
      break;
    case "INSCHRIJFDUUR": {
      const jaren = opties?.inschrijfjaren ?? null;
      if (jaren == null) {
        redenen.push({ ok: "onbekend", tekst: "Inschrijfduur: je kans hangt af van je inschrijftijd (onbekend)." });
      } else if (jaren >= 7) {
        punten += 1;
        redenen.push({ ok: "ja", tekst: `Lange inschrijfduur (${jaren} jaar) geeft een sterke positie.` });
      } else if (jaren < 3) {
        punten -= 1;
        redenen.push({ ok: "nee", tekst: `Korte inschrijfduur (${jaren} jaar) — bij inschrijfduur maak je nog weinig kans.` });
      } else {
        redenen.push({ ok: "onbekend", tekst: `Inschrijfduur ${jaren} jaar — gemiddelde positie.` });
      }
      break;
    }
    case "LOKALE_VOORRANG": {
      const heeftBinding =
        listing.lokaleBindingGemeente != null &&
        (profiel?.lokaleBinding ?? []).includes(listing.lokaleBindingGemeente);
      if (heeftBinding) {
        punten += 1;
        redenen.push({ ok: "ja", tekst: "Je hebt lokale binding — dat vergroot je kans hier." });
      } else {
        punten -= 1;
        redenen.push({ ok: "nee", tekst: "Zonder lokale binding is de kans klein." });
      }
      break;
    }
    case "DOORSTROMING":
      if ((profiel?.voorrangsredenen ?? []).includes("doorstromer")) {
        punten += 1;
        redenen.push({ ok: "ja", tekst: "Als doorstromer heb je voorrang." });
      } else {
        redenen.push({ ok: "onbekend", tekst: "Doorstroming: voorrang voor wie een woning achterlaat." });
      }
      break;
    default:
      redenen.push({ ok: "onbekend", tekst: info.korteUitleg });
  }

  // Huurniveau: goedkopere woningen zijn populairder → meer concurrentie
  if (listing.huurprijs < 600) {
    punten -= 1;
    redenen.push({ ok: "onbekend", tekst: "Lage huur trekt veel reacties — meer concurrentie." });
  }

  const indicatie = puntenNaarIndicatie(punten, geschiktScore, listing.verdeelmodel);
  return { indicatie, redenen };
}

function puntenNaarIndicatie(
  punten: number,
  geschiktScore: number,
  model: ListingInput["verdeelmodel"],
): Kansindicatie {
  if (model === "ONBEKEND" && geschiktScore < 40) return "ONBEKEND";
  if (punten >= 2) return "HOOG";
  if (punten === 1) return "GEMIDDELD";
  if (punten === 0) return "GEMIDDELD";
  if (punten === -1) return "LAAG";
  return "ZEER_LAAG";
}

/** Alles-in-één beoordeling: geschiktheid + woonwens + kans. */
export function beoordeelMatch(
  profiel: ProfielInput | null,
  listing: ListingInput,
  opties?: { inschrijfjaren?: number | null },
): MatchResultaat {
  const geschiktheid = beoordeelGeschiktheid(profiel, listing);
  const woonwens = beoordeelWoonwens(profiel, listing);
  const kans = beoordeelKans(profiel, listing, geschiktheid.score, opties);
  return { geschiktheid, woonwens, kans };
}

function labelType(t: string): string {
  return t
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export const KANS_LABEL: Record<Kansindicatie, string> = {
  ZEER_LAAG: "Zeer laag",
  LAAG: "Laag",
  GEMIDDELD: "Gemiddeld",
  HOOG: "Hoog",
  ONBEKEND: "Onbekend",
};

export const GESCHIKTHEID_LABEL = {
  WAARSCHIJNLIJK_GESCHIKT: "Waarschijnlijk geschikt",
  HANDMATIGE_CONTROLE: "Handmatige controle nodig",
  WAARSCHIJNLIJK_NIET_GESCHIKT: "Waarschijnlijk niet geschikt",
} as const;
