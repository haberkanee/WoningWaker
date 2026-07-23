"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { syncAllConnectors } from "@/lib/connectors/sync";
import { prisma } from "@/lib/prisma";
import { recomputeMatchesForUser } from "@/lib/matching";
import { audit } from "@/lib/audit";

export async function triggerSync() {
  await requireAdmin();
  await syncAllConnectors();
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) await recomputeMatchesForUser(u.id).catch(() => {});
  revalidatePath("/admin");
  revalidatePath("/status");
}

/**
 * Leegt het volledige aanbod: verwijdert alle woningen (en via cascade de
 * bijbehorende matches/favorieten). Gebruik dit om oude demodata te wissen —
 * echte woningen komen daarna vanzelf terug via de e-mailkoppeling.
 */
export async function leegAanbod() {
  const admin = await requireAdmin();
  const res = await prisma.listing.deleteMany({});
  await prisma.connectorStatus.deleteMany({});
  await audit({ userId: admin.id, actie: "aanbod.geleegd", metadata: { verwijderd: res.count } });
  revalidatePath("/admin");
  revalidatePath("/woningen");
  revalidatePath("/dashboard");
  revalidatePath("/status");
}
