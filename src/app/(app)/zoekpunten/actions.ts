"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { pointRuleSchema } from "@/lib/validators";
import { huidigeJaarMaand, laatsteDagVanMaand } from "@/lib/domain/zoekpunten";
import type { Verdeelmodel } from "@prisma/client";

export async function saveRule(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = pointRuleSchema.safeParse({
    regio: formData.get("regio"),
    reactiesPerMaand: formData.get("reactiesPerMaand") || 1,
    tellendeModellen: formData.getAll("tellendeModellen").map(String),
    actief: formData.get("actief") === "on",
  });
  if (!parsed.success) redirect("/zoekpunten?fout=1");
  const d = parsed.data;

  const rule = await prisma.searchPointRule.upsert({
    where: { userId_regio: { userId: user.id, regio: d.regio } },
    create: {
      userId: user.id, regio: d.regio, reactiesPerMaand: d.reactiesPerMaand,
      tellendeModellen: d.tellendeModellen as Verdeelmodel[], actief: d.actief,
    },
    update: {
      reactiesPerMaand: d.reactiesPerMaand,
      tellendeModellen: d.tellendeModellen as Verdeelmodel[], actief: d.actief,
    },
  });

  // Zorg dat de huidige maandperiode bestaat.
  const { jaar, maand } = huidigeJaarMaand();
  await prisma.searchPointPeriod.upsert({
    where: { ruleId_jaar_maand: { ruleId: rule.id, jaar, maand } },
    create: {
      ruleId: rule.id, userId: user.id, jaar, maand,
      doel: d.reactiesPerMaand, behaald: 0, deadline: laatsteDagVanMaand(jaar, maand),
    },
    update: { doel: d.reactiesPerMaand },
  });

  revalidatePath("/zoekpunten");
}

export async function deleteRule(id: string) {
  const user = await requireUser();
  await prisma.searchPointRule.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/zoekpunten");
}
