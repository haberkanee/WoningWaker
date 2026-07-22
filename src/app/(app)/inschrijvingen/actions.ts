"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validators";

export async function saveRegistration(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = registrationSchema.safeParse({
    platformSlug: formData.get("platformSlug") || "overig",
    platformNaam: formData.get("platformNaam"),
    regio: formData.get("regio") || null,
    status: formData.get("status") || "ACTIEF",
    inschrijfdatum: formData.get("inschrijfdatum") || null,
    verlengdatum: formData.get("verlengdatum") || null,
    inschrijfnummer: formData.get("inschrijfnummer") || null,
    actieNodig: formData.get("actieNodig") || null,
  });
  if (!parsed.success) redirect("/inschrijvingen?fout=1");
  const d = parsed.data;

  await prisma.platformRegistration.create({
    data: {
      userId: user.id,
      platformSlug: d.platformSlug,
      platformNaam: d.platformNaam,
      regio: d.regio ?? null,
      status: d.status,
      inschrijfdatum: d.inschrijfdatum ?? null,
      verlengdatum: d.verlengdatum ?? null,
      inschrijfnummer: d.inschrijfnummer ?? null,
      actieNodig: d.actieNodig ?? null,
    },
  });
  revalidatePath("/inschrijvingen");
}

export async function deleteRegistration(id: string) {
  const user = await requireUser();
  await prisma.platformRegistration.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/inschrijvingen");
}
