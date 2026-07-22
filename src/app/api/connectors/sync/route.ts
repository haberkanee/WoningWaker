import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncAllConnectors } from "@/lib/connectors/sync";
import { recomputeMatchesForUser } from "@/lib/matching";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Synchroniseert alle connectors en herberekent matches. Beveiligd met
 * CRON_SECRET (Bearer) of admin-sessie. Roep periodiek aan via cron.
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const viaCron = secret && authHeader === `Bearer ${secret}`;

  if (!viaCron) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
    }
  }

  const resultaten = await syncAllConnectors();

  // Herbereken matches voor alle gebruikers (klein volume in MVP).
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    await recomputeMatchesForUser(u.id).catch(() => {});
  }

  return NextResponse.json({ ok: true, connectors: resultaten, gebruikers: users.length });
}

export async function POST(req: Request) {
  return handle(req);
}
export async function GET(req: Request) {
  return handle(req);
}
