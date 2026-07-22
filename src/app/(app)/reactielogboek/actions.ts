"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@prisma/client";

export async function updateApplication(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as ApplicationStatus;
  const positieRaw = formData.get("positie");
  const positie = positieRaw ? Number(positieRaw) : null;
  const notities = formData.get("notities") ? String(formData.get("notities")) : null;

  const bestaand = await prisma.applicationLog.findFirst({ where: { id, userId: user.id } });
  if (!bestaand) return;

  await prisma.applicationLog.update({
    where: { id },
    data: {
      status,
      positie,
      notities,
      uitnodiging: status === "UITGENODIGD" || bestaand.uitnodiging,
      bezichtiging: status === "BEZICHTIGING" || bestaand.bezichtiging,
      aanbod: status === "AANBOD" || bestaand.aanbod,
      afwijzing: status === "AFGEWEZEN",
    },
  });
  revalidatePath("/reactielogboek");
}

export async function deleteApplication(id: string) {
  const user = await requireUser();
  await prisma.applicationLog.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/reactielogboek");
}
