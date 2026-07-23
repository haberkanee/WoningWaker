import type { Verdeelmodel, WoningType } from "@prisma/client";
import type { ConnectorResult, NormalizedListing, PlatformConnector } from "./types";
import { herkenVerdeelmodel } from "@/lib/domain/verdeelmodellen";
import { JSON_FEED_TESTDATA } from "./testdata";

interface FeedWoning {
  id: string;
  url: string;
  stad: string;
  buurt?: string;
  gemeente?: string;
  regio?: string;
  corporatie?: string;
  prijs: number;
  servicekosten?: number;
  m2?: number;
  kamers?: number;
  type?: string;
  model?: string;
  lift?: boolean;
  maxInkomen?: number;
  gepubliceerd: string;
  sluit?: string;
  titel?: string;
  omschrijving?: string;
}

const TYPE_MAP: Record<string, WoningType> = {
  APPARTEMENT: "APPARTEMENT",
  EENGEZINSWONING: "EENGEZINSWONING",
  STUDIO: "STUDIO",
  KAMER: "KAMER",
  BENEDENWONING: "BENEDENWONING",
  BOVENWONING: "BOVENWONING",
  SENIORENWONING: "SENIORENWONING",
};

function mapWoning(w: FeedWoning): NormalizedListing {
  const model: Verdeelmodel = w.model
    ? herkenVerdeelmodel(w.model)
    : "ONBEKEND";
  return {
    externalId: w.id,
    bronUrl: w.url,
    plaats: w.stad,
    wijk: w.buurt ?? null,
    gemeente: w.gemeente ?? null,
    regio: w.regio ?? null,
    corporatie: w.corporatie ?? null,
    huurprijs: w.prijs,
    servicekosten: w.servicekosten ?? 0,
    oppervlakte: w.m2 ?? null,
    kamers: w.kamers ?? null,
    woningtype: (w.type && TYPE_MAP[w.type.toUpperCase()]) || "ONBEKEND",
    verdeelmodel: model,
    heeftLift: w.lift ?? null,
    maxInkomen: w.maxInkomen ?? null,
    gepubliceerdOp: new Date(w.gepubliceerd),
    sluitDatum: w.sluit ? new Date(w.sluit) : null,
    titel: w.titel ?? null,
    omschrijving: w.omschrijving ?? null,
  };
}

/**
 * Generieke JSON-feedconnector. Leest een externe JSON-feed (officieel/
 * toegestaan) en normaliseert deze. Zonder FEED_URL valt hij terug op testdata.
 */
export function createJsonFeedConnector(opts?: {
  slug?: string;
  naam?: string;
  feedUrl?: string;
  regios?: string[];
}): PlatformConnector {
  return {
    slug: opts?.slug ?? "json-feed",
    naam: opts?.naam ?? "Woonmatch",
    bron: "feed",
    regios: opts?.regios ?? ["noord-holland-noord"],
    async fetchListings(): Promise<ConnectorResult> {
      const url = opts?.feedUrl ?? process.env.WONINGWAKER_FEED_URL;
      try {
        let payload: typeof JSON_FEED_TESTDATA;
        if (url) {
          const res = await fetch(url, { headers: { accept: "application/json" } });
          if (!res.ok) throw new Error(`Feed gaf status ${res.status}`);
          payload = await res.json();
        } else {
          payload = JSON_FEED_TESTDATA;
        }
        const listings = (payload.woningen ?? []).map(mapWoning);
        return { listings, gezond: true };
      } catch (err) {
        return {
          listings: [],
          gezond: false,
          fout: err instanceof Error ? err.message : "Onbekende feedfout",
        };
      }
    },
  };
}

export const jsonFeedConnector = createJsonFeedConnector();
