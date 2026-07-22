import type { Verdeelmodel } from "@prisma/client";

export interface VerdeelmodelInfo {
  key: Verdeelmodel;
  label: string;
  korteUitleg: string;
  uitleg: string;
  snelheidBelangrijk: boolean; // maakt als-eerste-reageren verschil?
  tip: string;
}

/**
 * Uitleg per verdeelmodel. Bij Direct Kans is snelheid belangrijk; bij loting
 * geeft als eerste reageren niet automatisch meer kans.
 */
export const VERDEELMODELLEN: Record<Verdeelmodel, VerdeelmodelInfo> = {
  INSCHRIJFDUUR: {
    key: "INSCHRIJFDUUR",
    label: "Inschrijfduur",
    korteUitleg: "Wie het langst ingeschreven staat, gaat voor.",
    uitleg:
      "De woning gaat naar de kandidaat met de langste inschrijftijd (of woonduur). Snel reageren maakt niet uit — je inschrijfduur bepaalt je positie.",
    snelheidBelangrijk: false,
    tip: "Reageer op alles wat past; je inschrijfduur telt, niet je reactietijd.",
  },
  LOTING: {
    key: "LOTING",
    label: "Loting",
    korteUitleg: "Een computer trekt willekeurig een winnaar.",
    uitleg:
      "Alle passende reacties doen mee in een loting. Iedereen heeft evenveel kans, ongeacht inschrijfduur of reactievolgorde.",
    snelheidBelangrijk: false,
    tip: "Als eerste reageren geeft geen extra kans. Reageer wél binnen de termijn.",
  },
  DIRECT_KANS: {
    key: "DIRECT_KANS",
    label: "Direct Kans",
    korteUitleg: "Wie als eerste passend reageert, maakt de meeste kans.",
    uitleg:
      "De woning wordt op volgorde van reactie aangeboden aan de eerste passende kandidaten. Snelheid telt hier écht mee.",
    snelheidBelangrijk: true,
    tip: "Reageer zo snel mogelijk — hier maakt elke minuut verschil.",
  },
  EERSTE_PASSENDE: {
    key: "EERSTE_PASSENDE",
    label: "Eerste passende kandidaat",
    korteUitleg: "De eerste die aan alle voorwaarden voldoet.",
    uitleg:
      "De corporatie loopt reacties op volgorde af en biedt aan de eerste kandidaat die volledig voldoet. Voldoen aan álle voorwaarden en snel reageren zijn beide belangrijk.",
    snelheidBelangrijk: true,
    tip: "Zorg dat je aan alle voorwaarden voldoet én reageer snel.",
  },
  JONGERENWONING: {
    key: "JONGERENWONING",
    label: "Jongerenwoning",
    korteUitleg: "Alleen voor een specifieke (jongere) leeftijdsgroep.",
    uitleg:
      "Gereserveerd voor jongeren binnen een leeftijdsgrens (vaak tot 23 of 28 jaar). Vaak gecombineerd met inschrijfduur of loting.",
    snelheidBelangrijk: false,
    tip: "Check de leeftijdsgrens — buiten de grens is reageren zinloos.",
  },
  SENIORENWONING: {
    key: "SENIORENWONING",
    label: "Seniorenwoning",
    korteUitleg: "Voor een oudere doelgroep (bv. 55+ of 65+).",
    uitleg:
      "Gereserveerd voor senioren vanaf een minimumleeftijd. Vaak gelijkvloers of met lift.",
    snelheidBelangrijk: false,
    tip: "Controleer de minimumleeftijd van de doelgroep.",
  },
  LOKALE_VOORRANG: {
    key: "LOKALE_VOORRANG",
    label: "Lokale voorrang",
    korteUitleg: "Inwoners van de gemeente/regio gaan voor.",
    uitleg:
      "Kandidaten met een economische of maatschappelijke binding aan de gemeente krijgen voorrang. Zonder binding is de kans klein.",
    snelheidBelangrijk: false,
    tip: "Zonder lokale binding maak je hier weinig kans.",
  },
  DOORSTROMING: {
    key: "DOORSTROMING",
    label: "Doorstroming",
    korteUitleg: "Voorrang voor huurders die een woning achterlaten.",
    uitleg:
      "Bedoeld om doorstroming te bevorderen: voorrang voor mensen die een sociale huurwoning of eengezinswoning achterlaten.",
    snelheidBelangrijk: false,
    tip: "Vooral kansrijk als je zelf een sociale huurwoning achterlaat.",
  },
  TIJDELIJKE_HUUR: {
    key: "TIJDELIJKE_HUUR",
    label: "Tijdelijke huur",
    korteUitleg: "Contract voor bepaalde tijd.",
    uitleg:
      "Een huurcontract voor bepaalde duur (bv. 1–2 jaar). Minder zekerheid, maar vaak sneller beschikbaar en minder concurrentie.",
    snelheidBelangrijk: true,
    tip: "Goede kans op korte termijn, maar let op de einddatum van het contract.",
  },
  ONBEKEND: {
    key: "ONBEKEND",
    label: "Onbekend verdeelmodel",
    korteUitleg: "Het verdeelmodel is niet af te leiden.",
    uitleg:
      "Het platform vermeldt het verdeelmodel niet duidelijk. Controleer de advertentie zelf.",
    snelheidBelangrijk: false,
    tip: "Lees de advertentie: hoe wordt deze woning toegewezen?",
  },
};

export function verdeelmodelInfo(m: Verdeelmodel): VerdeelmodelInfo {
  return VERDEELMODELLEN[m] ?? VERDEELMODELLEN.ONBEKEND;
}

/** Heuristische herkenning van een verdeelmodel uit vrije tekst. */
export function herkenVerdeelmodel(tekst: string | null | undefined): Verdeelmodel {
  if (!tekst) return "ONBEKEND";
  const t = tekst.toLowerCase();
  if (/(direct te huur|direct kans|op volgorde|wie het eerst)/.test(t)) return "DIRECT_KANS";
  if (/(loting|loot|verloting)/.test(t)) return "LOTING";
  if (/(inschrijfduur|inschrijftijd|woonduur|wachttijd)/.test(t)) return "INSCHRIJFDUUR";
  if (/(eerste passende|passende kandidaat)/.test(t)) return "EERSTE_PASSENDE";
  if (/(jongeren|jongerenwoning|tot 2[38] jaar)/.test(t)) return "JONGERENWONING";
  if (/(senior|55\+|65\+|ouderen)/.test(t)) return "SENIORENWONING";
  if (/(lokale binding|regiobinding|economische binding|voorrang inwoners)/.test(t))
    return "LOKALE_VOORRANG";
  if (/(doorstro|doorstromer)/.test(t)) return "DOORSTROMING";
  if (/(tijdelijk|bepaalde tijd|campuscontract)/.test(t)) return "TIJDELIJKE_HUUR";
  return "ONBEKEND";
}
