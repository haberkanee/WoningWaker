import { prisma } from "@/lib/prisma";
import { nieuwInboundToken } from "@/lib/inbound";

/**
 * Zorgt dat een (nieuwe) gebruiker de benodigde gerelateerde records heeft:
 * profiel, abonnement, documentchecklist, inbound-token, en de ADMIN-rol als het
 * e-mailadres gelijk is aan ADMIN_EMAIL. Idempotent.
 */
export async function bootstrapUser(userId: string, email: string | null | undefined) {
  const isAdmin = !!email && email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: isAdmin ? "ADMIN" : undefined,
      inboundToken: nieuwInboundToken(),
      profile: { connectOrCreate: { where: { userId }, create: {} } },
      subscription: {
        connectOrCreate: { where: { userId }, create: { plan: "GRATIS", status: "ACTIVE" } },
      },
    },
  }).catch(() => {});

  // Documentchecklist (alleen als er nog geen items zijn).
  const bestaat = await prisma.documentChecklistItem.count({ where: { userId } });
  if (bestaat === 0) {
    await prisma.documentChecklistItem.createMany({
      data: [
        { userId, type: "INKOMENSVERKLARING" },
        { userId, type: "LOONSTROOK" },
        { userId, type: "JAAROPGAVE" },
        { userId, type: "BRP_UITTREKSEL" },
        { userId, type: "VERHUURDERSVERKLARING" },
        { userId, type: "IDENTITEITSBEWIJS" },
      ],
      skipDuplicates: true,
    }).catch(() => {});
  }
}
