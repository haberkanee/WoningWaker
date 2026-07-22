"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { searchProfileSchema } from "@/lib/validators";
import { can } from "@/lib/plans";
import type { Verdeelmodel, WoningType } from "@prisma/client";

export async function createSearchProfile(formData: FormData): Promise<void> {
  const user = await requireUser();
  const plan = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } });

  // Feature-gating: Gratis mag één zoekprofiel.
  if (plan && !can(plan.plan, "meerdereZoekprofielen")) {
    const bestaand = await prisma.searchProfile.count({ where: { userId: user.id } });
    if (bestaand >= 1) {
      redirect("/zoekprofielen?fout=upgrade");
    }
  }

  const parsed = searchProfileSchema.safeParse({
    naam: formData.get("naam"),
    regios: formData.getAll("regios").map(String),
    gemeenten: splitList(formData.get("gemeenten")),
    maxHuurprijs: formData.get("maxHuurprijs") || null,
    minKamers: formData.get("minKamers") || null,
    minOppervlakte: formData.get("minOppervlakte") || null,
    woningtypes: formData.getAll("woningtypes").map(String),
    verdeelmodellen: formData.getAll("verdeelmodellen").map(String),
    alleenGeschikt: formData.get("alleenGeschikt") === "on",
    liftVereist: formData.get("liftVereist") === "on",
  });
  if (!parsed.success) redirect("/zoekprofielen?fout=1");

  const d = parsed.data;
  await prisma.searchProfile.create({
    data: {
      userId: user.id,
      naam: d.naam,
      regios: d.regios,
      gemeenten: d.gemeenten,
      maxHuurprijs: d.maxHuurprijs ?? null,
      minKamers: d.minKamers ?? null,
      minOppervlakte: d.minOppervlakte ?? null,
      woningtypes: d.woningtypes as WoningType[],
      verdeelmodellen: d.verdeelmodellen as Verdeelmodel[],
      alleenGeschikt: d.alleenGeschikt,
      liftVereist: d.liftVereist,
    },
  });
  revalidatePath("/zoekprofielen");
}

export async function deleteSearchProfile(id: string) {
  const user = await requireUser();
  await prisma.searchProfile.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/zoekprofielen");
}

export async function toggleSearchProfile(id: string) {
  const user = await requireUser();
  const sp = await prisma.searchProfile.findFirst({ where: { id, userId: user.id } });
  if (sp) {
    await prisma.searchProfile.update({ where: { id }, data: { actief: !sp.actief } });
  }
  revalidatePath("/zoekprofielen");
}

function splitList(v: FormDataEntryValue | null): string[] {
  if (!v) return [];
  return String(v).split(",").map((s) => s.trim()).filter(Boolean);
}
