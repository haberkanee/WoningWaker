import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayment, createSubscription, mollieEnabled } from "@/lib/mollie";
import type { Plan } from "@prisma/client";

export const dynamic = "force-dynamic";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/**
 * Mollie-webhook. Mollie stuurt alleen een payment-id; wij halen de betaling op
 * en verwerken de status:
 *  - eerste betaling betaald → maak maandabonnement + activeer plan
 *  - terugkerende betaling betaald → verleng de periode
 *  - mislukt/verlopen → markeer past_due (geen directe downgrade)
 */
export async function POST(req: Request) {
  if (!mollieEnabled()) {
    return NextResponse.json({ error: "Mollie niet geconfigureerd" }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const paymentId = form?.get("id");
  if (!paymentId || typeof paymentId !== "string") {
    return NextResponse.json({ error: "Geen payment id" }, { status: 400 });
  }

  let payment;
  try {
    payment = await getPayment(paymentId);
  } catch {
    // 200 teruggeven zodat Mollie niet blijft herhalen op een onvindbare betaling.
    return NextResponse.json({ received: true });
  }

  const userId = payment.metadata?.userId;
  const plan = payment.metadata?.plan as Plan | undefined;

  if (payment.status === "paid") {
    if (payment.sequenceType === "first" && userId && plan && payment.customerId) {
      // Eerste betaling gelukt → maandabonnement aanmaken en plan activeren.
      let subscriptionId: string | null = null;
      try {
        subscriptionId = await createSubscription({
          customerId: payment.customerId,
          plan,
          userId,
          webhookUrl: `${APP_URL}/api/mollie/webhook`,
        });
      } catch {
        /* abonnement kon niet worden aangemaakt; plan wordt wel geactiveerd */
      }
      await activeer(userId, plan, payment.customerId, subscriptionId);
    } else if (payment.sequenceType === "recurring" && payment.customerId) {
      // Terugkerende incasso gelukt → periode verlengen.
      await verleng(payment.customerId);
    }
  } else if (["failed", "expired", "canceled"].includes(payment.status)) {
    if (payment.sequenceType === "recurring" && payment.customerId) {
      await prisma.subscription.updateMany({
        where: { mollieCustomerId: payment.customerId },
        data: { status: "PAST_DUE" },
      });
    }
  }

  return NextResponse.json({ received: true });
}

async function activeer(userId: string, plan: Plan, customerId: string, subscriptionId: string | null) {
  const periodeEind = new Date(Date.now() + 31 * 86_400_000);
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId, plan, status: "ACTIVE", provider: "mollie",
      mollieCustomerId: customerId, mollieSubscriptionId: subscriptionId,
      currentPeriodEnd: periodeEind,
    },
    update: {
      plan, status: "ACTIVE", provider: "mollie",
      mollieCustomerId: customerId, mollieSubscriptionId: subscriptionId,
      currentPeriodEnd: periodeEind,
    },
  });
  await prisma.user.update({ where: { id: userId }, data: { plan } });
}

async function verleng(customerId: string) {
  await prisma.subscription.updateMany({
    where: { mollieCustomerId: customerId },
    data: { status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 31 * 86_400_000) },
  });
}
