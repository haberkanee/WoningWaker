"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { DocumentStatus, DocumentType } from "@prisma/client";

export async function updateDocument(formData: FormData) {
  const user = await requireUser();
  const type = String(formData.get("type")) as DocumentType;
  const status = String(formData.get("status")) as DocumentStatus;
  const verlooptRaw = formData.get("verloopt");
  const verloopt = verlooptRaw ? new Date(String(verlooptRaw)) : null;
  const voorMedeaanvrager = formData.get("voorMedeaanvrager") === "1";

  await prisma.documentChecklistItem.upsert({
    where: { userId_type_voorMedeaanvrager: { userId: user.id, type, voorMedeaanvrager } },
    create: { userId: user.id, type, status, verloopt, voorMedeaanvrager },
    update: { status, verloopt },
  });
  revalidatePath("/woningklaar");
}

export async function addMedeaanvrager() {
  const user = await requireUser();
  const types: DocumentType[] = ["INKOMENSVERKLARING", "LOONSTROOK", "IDENTITEITSBEWIJS"];
  for (const type of types) {
    await prisma.documentChecklistItem.upsert({
      where: { userId_type_voorMedeaanvrager: { userId: user.id, type, voorMedeaanvrager: true } },
      create: { userId: user.id, type, voorMedeaanvrager: true },
      update: {},
    });
  }
  revalidatePath("/woningklaar");
}
