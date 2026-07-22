"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function markAllRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, gelezen: false },
    data: { gelezen: true },
  });
  revalidatePath("/meldingen");
}

export async function markRead(id: string) {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { gelezen: true } });
  revalidatePath("/meldingen");
}
