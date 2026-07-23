import { prisma } from "@/lib/prisma";
import { connectors } from "./registry";
import type { NormalizedListing } from "./types";

export interface SyncResultaat {
  platformSlug: string;
  platformNaam: string;
  aantal: number;
  gezond: boolean;
  fout?: string;
}

/**
 * Haalt alle connectors op, normaliseert en upsert de woningen (dedup op
 * platformSlug + externalId) en werkt de connector-status bij voor de
 * platformstatuspagina.
 */
export async function syncAllConnectors(): Promise<SyncResultaat[]> {
  const resultaten: SyncResultaat[] = [];

  for (const connector of connectors) {
    let aantal = 0;
    let gezond = true;
    let fout: string | undefined;

    try {
      const result = await connector.fetchListings();
      gezond = result.gezond;
      fout = result.fout;
      for (const l of result.listings) {
        await upsertListing(connector.slug, l);
        aantal++;
      }
    } catch (err) {
      gezond = false;
      fout = err instanceof Error ? err.message : "Onbekende fout";
    }

    await prisma.connectorStatus.upsert({
      where: { platformSlug: connector.slug },
      create: {
        platformSlug: connector.slug,
        platformNaam: connector.naam,
        gezond,
        laatsteSync: new Date(),
        laatsteFout: fout ?? null,
        aantalWoningen: aantal,
      },
      update: {
        platformNaam: connector.naam,
        gezond,
        laatsteSync: new Date(),
        laatsteFout: fout ?? null,
        aantalWoningen: aantal,
      },
    });

    resultaten.push({
      platformSlug: connector.slug,
      platformNaam: connector.naam,
      aantal,
      gezond,
      fout,
    });
  }

  return resultaten;
}

async function upsertListing(platformSlug: string, l: NormalizedListing) {
  const data = {
    bronUrl: l.bronUrl,
    plaats: l.plaats,
    wijk: l.wijk ?? null,
    gemeente: l.gemeente ?? null,
    regio: l.regio ?? null,
    corporatie: l.corporatie ?? null,
    huurprijs: l.huurprijs,
    servicekosten: l.servicekosten ?? 0,
    oppervlakte: l.oppervlakte ?? null,
    kamers: l.kamers ?? null,
    slaapkamers: l.slaapkamers ?? null,
    woningtype: l.woningtype ?? "ONBEKEND",
    verdeelmodel: l.verdeelmodel ?? "ONBEKEND",
    verdiepingen: l.verdiepingen ?? null,
    heeftLift: l.heeftLift ?? null,
    beganeGrond: l.beganeGrond ?? null,
    minLeeftijd: l.minLeeftijd ?? null,
    maxLeeftijd: l.maxLeeftijd ?? null,
    maxInkomen: l.maxInkomen ?? null,
    minInkomen: l.minInkomen ?? null,
    maxHuishoudgrootte: l.maxHuishoudgrootte ?? null,
    minHuishoudgrootte: l.minHuishoudgrootte ?? null,
    lokaleBindingGemeente: l.lokaleBindingGemeente ?? null,
    doelgroep: l.doelgroep ?? null,
    gepubliceerdOp: l.gepubliceerdOp,
    sluitDatum: l.sluitDatum ?? null,
    titel: l.titel ?? null,
    omschrijving: l.omschrijving ?? null,
    fotoUrl: l.fotoUrl ?? null,
  } as const;

  await prisma.listing.upsert({
    where: { platformSlug_externalId: { platformSlug, externalId: l.externalId } },
    create: { platformSlug, externalId: l.externalId, ...data },
    update: data,
  });
}
