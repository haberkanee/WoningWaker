import type { ConnectorResult, PlatformConnector } from "./types";
import { RIJNMOND_TESTDATA } from "./testdata";

/**
 * Demo-connector voor Woonnet Rijnmond (Rotterdam-Rijnmond). MVP: mockdata.
 * Vervang later door de officiële feed/API zodra beschikbaar en toegestaan.
 */
export const rijnmondConnector: PlatformConnector = {
  slug: "rijnmond",
  naam: "Woonnet Rijnmond",
  bron: "demo",
  regios: ["rotterdam"],
  async fetchListings(): Promise<ConnectorResult> {
    return { listings: RIJNMOND_TESTDATA, gezond: true };
  },
};
