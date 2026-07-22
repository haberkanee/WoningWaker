"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validators";
import { recomputeMatchesForUser } from "@/lib/matching";
import { audit } from "@/lib/audit";
import type { WoningType } from "@prisma/client";

export async function saveProfile(formData: FormData): Promise<void> {
  const user = await requireUser();

  const raw = {
    brutoJaarinkomen: formData.get("brutoJaarinkomen") || null,
    huishoudgrootte: formData.get("huishoudgrootte") || null,
    leeftijd: formData.get("leeftijd") || null,
    huidigeWoonplaats: formData.get("huidigeWoonplaats") || null,
    gewensteRegios: formData.getAll("gewensteRegios").map(String),
    gewensteGemeenten: splitList(formData.get("gewensteGemeenten")),
    maxHuurprijs: formData.get("maxHuurprijs") || null,
    minKamers: formData.get("minKamers") || null,
    woningtypes: formData.getAll("woningtypes").map(String) as WoningType[],
    liftVereist: formData.get("liftVereist") === "on",
    beganeGrondVereist: formData.get("beganeGrondVereist") === "on",
    maxReisafstandKm: formData.get("maxReisafstandKm") || null,
    lokaleBinding: splitList(formData.get("lokaleBinding")),
    voorrangsredenen: formData.getAll("voorrangsredenen").map(String),
    studerend: formData.get("studerend") === "on",
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/profiel?fout=1");
  }

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
  });

  await audit({ userId: user.id, actie: "profiel.opgeslagen", entiteit: "Profile" });

  // Herbereken matches op de achtergrond (best-effort).
  await recomputeMatchesForUser(user.id).catch(() => {});

  revalidatePath("/profiel");
  revalidatePath("/woningen");
  revalidatePath("/dashboard");
  redirect("/profiel?opgeslagen=1");
}

function splitList(v: FormDataEntryValue | null): string[] {
  if (!v) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
