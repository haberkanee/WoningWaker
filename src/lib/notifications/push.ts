import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import type { NotifyInput } from "./index";

let geconfigureerd = false;

function configure(): boolean {
  if (geconfigureerd) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:meldingen@woningwaker.nl",
    pub,
    priv,
  );
  geconfigureerd = true;
  return true;
}

/** Verstuurt een web-push naar alle subscriptions van een gebruiker. */
export async function sendPush(userId: string, input: NotifyInput): Promise<void> {
  if (!configure()) return; // geen VAPID-keys → no-op

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const payload = JSON.stringify({
    title: input.titel,
    body: input.body,
    url: input.url ?? "/dashboard",
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (err: unknown) {
        // Verwijder verlopen subscriptions (410 Gone / 404).
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );
}
