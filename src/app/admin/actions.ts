"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { syncAllConnectors } from "@/lib/connectors/sync";
import { prisma } from "@/lib/prisma";
import { recomputeMatchesForUser } from "@/lib/matching";

export async function triggerSync() {
  await requireAdmin();
  await syncAllConnectors();
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) await recomputeMatchesForUser(u.id).catch(() => {});
  revalidatePath("/admin");
  revalidatePath("/status");
}
