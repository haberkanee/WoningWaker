import type { Plan } from "@prisma/client";

export interface PlanFeature {
  tekst: string;
}

export interface PlanConfig {
  key: Plan;
  naam: string;
  prijs: number; // euro per maand
  prijsLabel: string;
  maxRegios: number | "alle";
  stripePriceEnv?: string;
  features: string[];
  // capaciteiten voor feature-gating
  can: {
    pushMeldingen: boolean;
    telegram: boolean;
    meerdereZoekprofielen: boolean;
    zoekpuntWaker: boolean;
    reactielogboek: boolean;
    woningKlaar: boolean;
    uitgebreideStatistieken: boolean;
    geavanceerdeKans: boolean;
  };
}

export const PLANS: Record<Plan, PlanConfig> = {
  GRATIS: {
    key: "GRATIS",
    naam: "Gratis",
    prijs: 0,
    prijsLabel: "€0",
    maxRegios: 1,
    features: [
      "Eén regio",
      "Basisgeschiktheidscontrole",
      "Dagelijks overzicht",
      "Inschrijvingsmanager",
    ],
    can: {
      pushMeldingen: false,
      telegram: false,
      meerdereZoekprofielen: false,
      zoekpuntWaker: false,
      reactielogboek: false,
      woningKlaar: false,
      uitgebreideStatistieken: false,
      geavanceerdeKans: false,
    },
  },
  WAKER: {
    key: "WAKER",
    naam: "Waker",
    prijs: 6.99,
    prijsLabel: "€6,99",
    maxRegios: 3,
    stripePriceEnv: "STRIPE_PRICE_WAKER",
    features: [
      "Drie regio's",
      "Directe pushmeldingen",
      "Meerdere zoekprofielen",
      "ZoekpuntWaker",
      "Reactielogboek",
    ],
    can: {
      pushMeldingen: true,
      telegram: false,
      meerdereZoekprofielen: true,
      zoekpuntWaker: true,
      reactielogboek: true,
      woningKlaar: false,
      uitgebreideStatistieken: false,
      geavanceerdeKans: false,
    },
  },
  WAKER_PLUS: {
    key: "WAKER_PLUS",
    naam: "Waker Plus",
    prijs: 11.99,
    prijsLabel: "€11,99",
    maxRegios: "alle",
    stripePriceEnv: "STRIPE_PRICE_WAKER_PLUS",
    features: [
      "Alle ondersteunde regio's",
      "Telegrammeldingen",
      "WoningKlaar",
      "Uitgebreide statistieken",
      "Geavanceerde kansindicatie",
    ],
    can: {
      pushMeldingen: true,
      telegram: true,
      meerdereZoekprofielen: true,
      zoekpuntWaker: true,
      reactielogboek: true,
      woningKlaar: true,
      uitgebreideStatistieken: true,
      geavanceerdeKans: true,
    },
  },
};

export function planConfig(plan: Plan): PlanConfig {
  return PLANS[plan] ?? PLANS.GRATIS;
}

export function can(plan: Plan, feature: keyof PlanConfig["can"]): boolean {
  return planConfig(plan).can[feature];
}
