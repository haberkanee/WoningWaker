import type { Plan } from "@prisma/client";
import { planConfig } from "@/lib/plans";

/**
 * Mollie-integratie via de officiële REST API (geen extra dependency).
 * Ondersteunt iDEAL, creditcard en automatische incasso met maandabonnementen.
 * Optioneel: zonder MOLLIE_API_KEY draaien upgrades in demo-modus.
 *
 * Abonnementsflow (Mollie vereist een mandaat voor terugkerende incasso):
 *  1. eerste betaling (sequenceType "first") → klant betaalt eenmalig, mandaat ontstaat
 *  2. bij 'paid' webhook → maak een maandabonnement aan op de klant
 *  3. Mollie int daarna maandelijks en roept de webhook per betaling aan
 */

const BASE = "https://api.mollie.com/v2";

export function mollieEnabled(): boolean {
  return !!process.env.MOLLIE_API_KEY;
}

export function bedragVoorPlan(plan: Plan): string {
  // Mollie verwacht een string met 2 decimalen, bv. "6.99"
  return planConfig(plan).prijs.toFixed(2);
}

interface MollieError {
  detail?: string;
}

async function mollie<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) throw new Error("MOLLIE_API_KEY ontbreekt");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = `Mollie ${res.status}`;
    try {
      const err = (await res.json()) as MollieError;
      if (err.detail) detail = err.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

export interface MolliePayment {
  id: string;
  status: "open" | "paid" | "failed" | "canceled" | "expired" | "pending" | "authorized";
  sequenceType: "oneoff" | "first" | "recurring";
  customerId?: string;
  subscriptionId?: string;
  amount: { currency: string; value: string };
  metadata?: { userId?: string; plan?: Plan } | null;
  _links?: { checkout?: { href: string } };
}

export async function createCustomer(name: string, email: string): Promise<string> {
  const c = await mollie<{ id: string }>("POST", "/customers", { name, email });
  return c.id;
}

/** Eerste betaling om een mandaat te verkrijgen; retourneert de checkout-URL. */
export async function createFirstPayment(opts: {
  customerId: string;
  plan: Plan;
  userId: string;
  redirectUrl: string;
  webhookUrl: string;
}): Promise<string> {
  const p = await mollie<MolliePayment>("POST", "/payments", {
    amount: { currency: "EUR", value: bedragVoorPlan(opts.plan) },
    description: `WoningWaker ${planConfig(opts.plan).naam} — eerste maand`,
    sequenceType: "first",
    customerId: opts.customerId,
    redirectUrl: opts.redirectUrl,
    webhookUrl: opts.webhookUrl,
    metadata: { userId: opts.userId, plan: opts.plan },
  });
  const url = p._links?.checkout?.href;
  if (!url) throw new Error("Geen checkout-URL van Mollie ontvangen");
  return url;
}

export async function getPayment(id: string): Promise<MolliePayment> {
  return mollie<MolliePayment>("GET", `/payments/${id}`);
}

export async function createSubscription(opts: {
  customerId: string;
  plan: Plan;
  webhookUrl: string;
  userId: string;
}): Promise<string> {
  const sub = await mollie<{ id: string }>(
    "POST",
    `/customers/${opts.customerId}/subscriptions`,
    {
      amount: { currency: "EUR", value: bedragVoorPlan(opts.plan) },
      interval: "1 month",
      description: `WoningWaker ${planConfig(opts.plan).naam}`,
      webhookUrl: opts.webhookUrl,
      metadata: { userId: opts.userId, plan: opts.plan },
    },
  );
  return sub.id;
}

export async function cancelSubscription(customerId: string, subscriptionId: string): Promise<void> {
  await mollie("DELETE", `/customers/${customerId}/subscriptions/${subscriptionId}`);
}
