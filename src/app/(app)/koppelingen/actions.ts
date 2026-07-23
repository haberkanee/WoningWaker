"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { pollGmailForUser } from "@/lib/gmail-poll";
import { audit } from "@/lib/audit";

export async function ontkoppelGmail() {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { gmailRefreshToken: null, gmailEmail: null, gmailConnectedAt: null, gmailLastSyncAt: null },
  });
  await audit({ userId: user.id, actie: "gmail.ontkoppeld" });
  revalidatePath("/koppelingen");
}

export async function haalGmailNu() {
  const user = await requireUser();
  await pollGmailForUser(user.id).catch(() => {});
  revalidatePath("/koppelingen");
  revalidatePath("/woningen");
}
