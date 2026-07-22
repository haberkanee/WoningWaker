import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, planVoorPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { Plan, SubscriptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/** Stripe webhook: houdt abonnementen en plannen in sync. */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe niet geconfigureerd" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, secret);
  } catch {
    return NextResponse.json({ error: "Ongeldige handtekening" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await syncSubscription(userId, sub);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId ?? (await userIdVoorCustomer(sub.customer as string));
      if (userId) await syncSubscription(userId, sub);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function userIdVoorCustomer(customerId: string): Promise<string | null> {
  const sub = await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
  return sub?.userId ?? null;
}

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  incomplete: "INCOMPLETE",
  unpaid: "PAST_DUE",
};

async function syncSubscription(userId: string, sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price.id;
  const status = sub.status === "canceled" || sub.status === "unpaid";
  const plan: Plan = status ? "GRATIS" : planVoorPriceId(priceId);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId, plan, status: STATUS_MAP[sub.status] ?? "ACTIVE",
      stripeCustomerId: sub.customer as string,
      stripeSubscriptionId: sub.id, stripePriceId: priceId,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    update: {
      plan, status: STATUS_MAP[sub.status] ?? "ACTIVE",
      stripeSubscriptionId: sub.id, stripePriceId: priceId,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
  await prisma.user.update({ where: { id: userId }, data: { plan } });
}
