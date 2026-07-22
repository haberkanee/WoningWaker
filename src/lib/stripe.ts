import Stripe from "stripe";
import type { Plan } from "@prisma/client";

let stripe: Stripe | null = null;

/** Stripe-client (null zonder secret key → gedegradeerde modus). */
export function getStripe(): Stripe | null {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return stripe;
}

export function priceIdVoorPlan(plan: Plan): string | undefined {
  if (plan === "WAKER") return process.env.STRIPE_PRICE_WAKER;
  if (plan === "WAKER_PLUS") return process.env.STRIPE_PRICE_WAKER_PLUS;
  return undefined;
}

export function planVoorPriceId(priceId: string | null | undefined): Plan {
  if (!priceId) return "GRATIS";
  if (priceId === process.env.STRIPE_PRICE_WAKER) return "WAKER";
  if (priceId === process.env.STRIPE_PRICE_WAKER_PLUS) return "WAKER_PLUS";
  return "GRATIS";
}
