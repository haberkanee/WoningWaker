import type { ConnectorResult, PlatformConnector } from "./types";
import { DAK_TESTDATA } from "./testdata";

/**
 * Demo-connector voor Mijn DAK (Drechtsteden). MVP: mockdata. Vervang
 * `fetchListings` later door een aanroep naar de officiële API/feed van DAK
 * zodra die beschikbaar en toegestaan is.
 */
export const dakConnector: PlatformConnector = {
  slug: "dak",
  naam: "Mijn DAK (Woonkeus Drechtsteden)",
  bron: "demo",
  regios: ["drechtsteden"],
  async fetchListings(): Promise<ConnectorResult> {
    // Simuleer netwerklatentie zonder echte scraping.
    return { listings: DAK_TESTDATA, gezond: true };
  },
};
