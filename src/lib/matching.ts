import { prisma } from "@/lib/prisma";
import { Prisma, type Listing, type Profile } from "@prisma/client";
import { beoordeelMatch } from "@/lib/domain/scoring";
import type { ProfielInput } from "@/lib/domain/types";
import { notify } from "@/lib/notifications";
import { euro, tijdTot } from "@/lib/utils";
import { KANS_LABEL, GESCHIKTHEID_LABEL } from "@/lib/domain/scoring";

/**
 * Zorgt dat er woningen zijn (sync bij lege database) en dat de matches van de
 * gebruiker berekend zijn. Idempotent en veilig om bij paginabezoek aan te roepen.
 */
export async function ensureUserData(userId: string): Promise<void> {
  const aantalListings = await prisma.listing.count();
  if (aantalListings === 0) {
    const { syncAllConnectors } = await import("@/lib/connectors/sync");
    await syncAllConnectors().catch(() => {});
  }
  const aantalMatches = await prisma.listingMatch.count({ where: { userId } });
  const totaal = await prisma.listing.count();
  if (aantalMatches < totaal) {
    await recomputeMatchesForUser(userId).catch(() => {});
  }
}

function toProfielInput(p: Profile | null): ProfielInput | null {
  if (!p) return null;
  return {
    brutoJaarinkomen: p.brutoJaarinkomen,
    huishoudgrootte: p.huishoudgrootte,
    leeftijd: p.leeftijd,
    huidigeWoonplaats: p.huidigeWoonplaats,
    gewensteRegios: p.gewensteRegios,
    gewensteGemeenten: p.gewensteGemeenten,
    maxHuurprijs: p.maxHuurprijs,
    minKamers: p.minKamers,
    woningtypes: p.woningtypes,
    liftVereist: p.liftVereist,
    beganeGrondVereist: p.beganeGrondVereist,
    lokaleBinding: p.lokaleBinding,
    voorrangsredenen: p.voorrangsredenen,
    studerend: p.studerend,
  };
}

/** Inschrijfjaren voor een gebruiker/regio (voor kansindicatie bij inschrijfduur). */
async function inschrijfjaren(userId: string, regio: string | null): Promise<number | null> {
  if (!regio) return null;
  const reg = await prisma.platformRegistration.findFirst({
    where: { userId, regio, inschrijfdatum: { not: null } },
    orderBy: { inschrijfdatum: "asc" },
  });
  if (!reg?.inschrijfdatum) return null;
  return Math.floor((Date.now() - reg.inschrijfdatum.getTime()) / (365.25 * 86_400_000));
}

/**
 * (Her)berekent en cachet ListingMatch-records voor één gebruiker over alle
 * (niet verborgen) woningen. Stuurt een NIEUWE_MATCH-melding bij sterke,
 * geschikte matches (met dedup).
 */
export async function recomputeMatchesForUser(userId: string): Promise<number> {
  const [profile, listings, hidden] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.listing.findMany(),
    prisma.hiddenListing.findMany({ where: { userId }, select: { listingId: true } }),
  ]);
  const hiddenIds = new Set(hidden.map((h) => h.listingId));
  const profielInput = toProfielInput(profile);

  let count = 0;
  for (const listing of listings) {
    if (hiddenIds.has(listing.id)) continue;
    const jaren = await inschrijfjaren(userId, listing.regio);
    const result = beoordeelMatch(profielInput, listing, { inschrijfjaren: jaren });

    const geschiktheidRedenen = result.geschiktheid.redenen as unknown as Prisma.InputJsonValue;
    const woonwensRedenen = result.woonwens.redenen as unknown as Prisma.InputJsonValue;
    const kansRedenen = result.kans.redenen as unknown as Prisma.InputJsonValue;

    await prisma.listingMatch.upsert({
      where: { userId_listingId: { userId, listingId: listing.id } },
      create: {
        userId,
        listingId: listing.id,
        geschiktheidScore: result.geschiktheid.score,
        geschiktheidStatus: result.geschiktheid.status,
        woonwensScore: result.woonwens.score,
        kansindicatie: result.kans.indicatie,
        geschiktheidRedenen,
        woonwensRedenen,
        kansRedenen,
      },
      update: {
        geschiktheidScore: result.geschiktheid.score,
        geschiktheidStatus: result.geschiktheid.status,
        woonwensScore: result.woonwens.score,
        kansindicatie: result.kans.indicatie,
        geschiktheidRedenen,
        woonwensRedenen,
        kansRedenen,
      },
    });
    count++;

    // Meld sterke, geschikte matches (dedup per gebruiker+woning).
    if (
      result.geschiktheid.status === "WAARSCHIJNLIJK_GESCHIKT" &&
      result.woonwens.score >= 75
    ) {
      await meldMatch(userId, listing, result.woonwens.score, result.kans.indicatie, result.geschiktheid.status);
    }
  }
  return count;
}

async function meldMatch(
  userId: string,
  listing: Listing,
  woonwens: number,
  kans: keyof typeof KANS_LABEL,
  status: keyof typeof GESCHIKTHEID_LABEL,
) {
  await notify({
    userId,
    type: "NIEUWE_MATCH",
    titel: `Nieuwe ${listing.verdeelmodel === "LOTING" ? "lotingwoning" : "woning"} in ${listing.plaats}`,
    body: [
      `Woonwensscore: ${woonwens}%`,
      GESCHIKTHEID_LABEL[status],
      `${euro(listing.huurprijs)} per maand · ${listing.kamers ?? "?"} kamers`,
      listing.sluitDatum ? `Sluit over ${tijdTot(listing.sluitDatum)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    url: `/woningen/${listing.id}`,
    dedupeKey: `match:${listing.id}`,
  });
}
