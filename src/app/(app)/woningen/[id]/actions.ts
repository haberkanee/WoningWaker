"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { huidigeJaarMaand } from "@/lib/domain/zoekpunten";

/**
 * Registreert dat de gebruiker DEFINITIEF heeft gereageerd. Dit gebeurt pas
 * nadat de gebruiker zelf op het officiële platform heeft gereageerd en hier
 * bevestigt — WoningWaker dient nooit zelf een reactie in.
 */
export async function bevestigDefinitiefGereageerd(listingId: string) {
  const user = await requireUser();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Woning niet gevonden." };

  const match = await prisma.listingMatch.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });

  const bestaand = await prisma.applicationLog.findFirst({
    where: { userId: user.id, listingId, status: { in: ["GEREAGEERD", "VOORBEREID"] } },
  });

  if (bestaand) {
    await prisma.applicationLog.update({
      where: { id: bestaand.id },
      data: { status: "GEREAGEERD", gereageerdOp: new Date() },
    });
  } else {
    await prisma.applicationLog.create({
      data: {
        userId: user.id,
        listingId,
        woningTitel: listing.titel ?? `${listing.woningtype} ${listing.plaats}`,
        platformSlug: listing.platformSlug,
        regio: listing.regio,
        verdeelmodel: listing.verdeelmodel,
        geschiktheidScore: match?.geschiktheidScore,
        woonwensScore: match?.woonwensScore,
        kansindicatie: match?.kansindicatie,
        status: "GEREAGEERD",
        gereageerdOp: new Date(),
      },
    });
  }

  // Tel mee voor ZoekpuntWaker in de regio van de woning (deze maand).
  if (listing.regio) {
    await telZoekpunt(user.id, listing.regio);
  }

  await audit({
    userId: user.id,
    actie: "reactie.definitief",
    entiteit: "Listing",
    entiteitId: listingId,
  });

  revalidatePath("/reactielogboek");
  revalidatePath("/zoekpunten");
  revalidatePath(`/woningen/${listingId}`);
  return { ok: true };
}

async function telZoekpunt(userId: string, regio: string) {
  const rule = await prisma.searchPointRule.findUnique({
    where: { userId_regio: { userId, regio } },
  });
  if (!rule || !rule.actief) return;
  const { jaar, maand } = huidigeJaarMaand();
  const deadline = new Date(jaar, maand, 0, 23, 59, 59);
  await prisma.searchPointPeriod.upsert({
    where: { ruleId_jaar_maand: { ruleId: rule.id, jaar, maand } },
    create: { ruleId: rule.id, userId, jaar, maand, doel: rule.reactiesPerMaand, behaald: 1, deadline },
    update: { behaald: { increment: 1 } },
  });
}
