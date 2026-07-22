"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { getStripe, priceIdVoorPlan } from "@/lib/stripe";
import type { NotificationChannel, NotificationType, Plan } from "@prisma/client";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/**
 * Start een upgrade. Met Stripe-config maken we een checkout-sessie; zonder
 * Stripe schakelen we het plan direct om (demo-modus) zodat de MVP werkt.
 */
export async function upgradePlan(formData: FormData) {
  const user = await requireUser();
  const plan = String(formData.get("plan")) as Plan;
  if (plan !== "WAKER" && plan !== "WAKER_PLUS" && plan !== "GRATIS") return;

  const stripe = getStripe();
  const priceId = priceIdVoorPlan(plan);

  if (stripe && priceId && plan !== "GRATIS") {
    const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    let customerId = sub?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.subscription.update({ where: { userId: user.id }, data: { stripeCustomerId: customerId } });
    }
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/instellingen?upgrade=ok`,
      cancel_url: `${APP_URL}/instellingen?upgrade=cancel`,
      metadata: { userId: user.id, plan },
    });
    if (checkout.url) redirect(checkout.url);
    return;
  }

  // Demo-modus zonder Stripe.
  await prisma.user.update({ where: { id: user.id }, data: { plan } });
  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, plan, status: "ACTIVE" },
    update: { plan, status: "ACTIVE" },
  });
  await audit({ userId: user.id, actie: "plan.gewijzigd", metadata: { plan, modus: "demo" } });
  revalidatePath("/instellingen");
}

export async function saveTelegram(formData: FormData) {
  const user = await requireUser();
  const chatId = String(formData.get("telegramChatId") || "").trim() || null;
  await prisma.user.update({ where: { id: user.id }, data: { telegramChatId: chatId } });
  revalidatePath("/instellingen");
}

export async function toggleNotificationPref(
  type: NotificationType,
  channel: NotificationChannel,
  enabled: boolean,
) {
  const user = await requireUser();
  await prisma.notificationPreference.upsert({
    where: { userId_type_channel: { userId: user.id, type, channel } },
    create: { userId: user.id, type, channel, enabled },
    update: { enabled },
  });
  revalidatePath("/instellingen");
}

/** Verwijdert het account en alle bijbehorende gegevens (AVG). */
export async function deleteAccount(formData: FormData): Promise<void> {
  const user = await requireUser();
  const bevestiging = String(formData.get("bevestiging") || "");
  if (bevestiging !== "VERWIJDER") {
    redirect("/instellingen?verwijder=bevestig");
  }
  await audit({ userId: user.id, actie: "account.verwijderd" });
  await prisma.user.delete({ where: { id: user.id } });
  await signOut({ redirectTo: "/" });
}
