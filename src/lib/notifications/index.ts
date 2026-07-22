import type { NotificationChannel, NotificationType, Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/plans";
import { sendPush } from "./push";
import { sendEmailNotification } from "./email";
import { sendTelegram } from "./telegram";

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  titel: string;
  body: string;
  url?: string;
  /** Unieke sleutel om dubbele meldingen te voorkomen. */
  dedupeKey: string;
}

/**
 * Verstuurt een melding via alle toegestane kanalen en voorkomt dubbele
 * meldingen via de unieke (userId, dedupeKey). Kanalen degraderen netjes als de
 * betreffende integratie niet is geconfigureerd.
 */
export async function notify(input: NotifyInput): Promise<{ nieuw: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { plan: true, email: true, telegramChatId: true },
  });
  if (!user) return { nieuw: false };

  const kanalen = await bepaalKanalen(input.userId, input.type, user.plan);

  // Dedup: sla de dashboardmelding op; als hij al bestaat, stop.
  const bestaat = await prisma.notification.findUnique({
    where: { userId_dedupeKey: { userId: input.userId, dedupeKey: input.dedupeKey } },
    select: { id: true },
  });
  if (bestaat) return { nieuw: false };

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      titel: input.titel,
      body: input.body,
      url: input.url,
      dedupeKey: input.dedupeKey,
      channels: kanalen,
    },
  });

  // Verstuur async via externe kanalen (best-effort).
  await Promise.allSettled([
    kanalen.includes("PUSH") ? sendPush(input.userId, input) : Promise.resolve(),
    kanalen.includes("EMAIL") && user.email
      ? sendEmailNotification(user.email, input)
      : Promise.resolve(),
    kanalen.includes("TELEGRAM") && user.telegramChatId
      ? sendTelegram(user.telegramChatId, input)
      : Promise.resolve(),
  ]);

  return { nieuw: true };
}

async function bepaalKanalen(
  userId: string,
  type: NotificationType,
  plan: Plan,
): Promise<NotificationChannel[]> {
  const kanalen = new Set<NotificationChannel>(["DASHBOARD"]);

  // Planrechten
  if (can(plan, "pushMeldingen")) kanalen.add("PUSH");
  if (can(plan, "telegram")) kanalen.add("TELEGRAM");
  kanalen.add("EMAIL"); // e-mail voor alle plannen

  // Gebruikersvoorkeuren kunnen kanalen uitzetten
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId, type },
  });
  for (const p of prefs) {
    if (!p.enabled) kanalen.delete(p.channel);
  }

  return Array.from(kanalen);
}
