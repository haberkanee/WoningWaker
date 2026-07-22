import type { Verdeelmodel, WoningType } from "@prisma/client";

/**
 * Genormaliseerde woning zoals een connector die oplevert. De sync-laag vertaalt
 * dit naar een Listing-record (dedup op platformSlug + externalId).
 */
export interface NormalizedListing {
  externalId: string;
  bronUrl: string;
  plaats: string;
  wijk?: string | null;
  gemeente?: string | null;
  regio?: string | null;
  corporatie?: string | null;

  huurprijs: number;
  servicekosten?: number;
  oppervlakte?: number | null;
  kamers?: number | null;
  slaapkamers?: number | null;
  woningtype?: WoningType;
  verdeelmodel?: Verdeelmodel;
  verdiepingen?: number | null;
  heeftLift?: boolean | null;
  beganeGrond?: boolean | null;

  minLeeftijd?: number | null;
  maxLeeftijd?: number | null;
  maxInkomen?: number | null;
  minInkomen?: number | null;
  maxHuishoudgrootte?: number | null;
  minHuishoudgrootte?: number | null;
  lokaleBindingGemeente?: string | null;
  doelgroep?: string | null;

  gepubliceerdOp: Date;
  sluitDatum?: Date | null;
  titel?: string | null;
  omschrijving?: string | null;
}

export interface ConnectorResult {
  listings: NormalizedListing[];
  gezond: boolean;
  fout?: string;
}

/**
 * Elke platformkoppeling implementeert deze interface. Zo zijn platforms als
 * Mijn DAK, Woonnet Rijnmond, Woonmatch, Huiswaarts en Woonkeus later pluggable.
 *
 * BELANGRIJK: connectors gebruiken uitsluitend officiële API's, feeds of
 * e-mailmeldingen. Geen scraping/CAPTCHA-omzeiling zonder aantoonbare toestemming.
 */
export interface PlatformConnector {
  slug: string;
  naam: string;
  /** Bron: officiële API, feed, e-mail of (voorlopig) demo/mock. */
  bron: "api" | "feed" | "email" | "demo";
  regios: string[];
  fetchListings(): Promise<ConnectorResult>;
}
