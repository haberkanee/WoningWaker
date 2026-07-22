import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Auditlogging voor beveiligings-/privacygevoelige acties. Log NOOIT
 * wachtwoorden of andere gevoelige gegevens in de metadata.
 */
export async function audit(input: {
  userId?: string | null;
  actie: string;
  entiteit?: string;
  entiteitId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        actie: input.actie,
        entiteit: input.entiteit,
        entiteitId: input.entiteitId,
        metadata: input.metadata
          ? (sanitize(input.metadata) as Prisma.InputJsonValue)
          : undefined,
        ip: input.ip ?? null,
      },
    });
  } catch {
    // Auditlog mag nooit de hoofdactie breken.
  }
}

const GEVOELIG = /(password|wachtwoord|token|secret|passwordhash|creditcard|iban)/i;

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = GEVOELIG.test(k) ? "[weggelaten]" : v;
  }
  return out;
}
