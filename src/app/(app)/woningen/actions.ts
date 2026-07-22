"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function toggleFavorite(listingId: string) {
  const user = await requireUser();
  const bestaand = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });
  if (bestaand) {
    await prisma.favorite.delete({ where: { id: bestaand.id } });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, listingId } });
  }
  revalidatePath("/woningen");
  revalidatePath(`/woningen/${listingId}`);
}

export async function toggleHidden(listingId: string) {
  const user = await requireUser();
  const bestaand = await prisma.hiddenListing.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });
  if (bestaand) {
    await prisma.hiddenListing.delete({ where: { id: bestaand.id } });
  } else {
    await prisma.hiddenListing.create({ data: { userId: user.id, listingId } });
  }
  revalidatePath("/woningen");
}

export async function saveNote(listingId: string, tekst: string) {
  const user = await requireUser();
  if (!tekst.trim()) {
    await prisma.listingNote.deleteMany({ where: { userId: user.id, listingId } });
  } else {
    await prisma.listingNote.upsert({
      where: { userId_listingId: { userId: user.id, listingId } },
      create: { userId: user.id, listingId, tekst: tekst.slice(0, 1000) },
      update: { tekst: tekst.slice(0, 1000) },
    });
  }
  revalidatePath(`/woningen/${listingId}`);
}
