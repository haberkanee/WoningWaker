import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

/** AVG-gegevensexport: alle persoonsgegevens van de gebruiker als JSON-download. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const userId = session.user.id;

  const [user, profile, searchProfiles, registrations, applications, documents, pointRules, notifications] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, plan: true, role: true, createdAt: true, telegramChatId: true },
      }),
      prisma.profile.findUnique({ where: { userId } }),
      prisma.searchProfile.findMany({ where: { userId } }),
      prisma.platformRegistration.findMany({ where: { userId } }),
      prisma.applicationLog.findMany({ where: { userId } }),
      prisma.documentChecklistItem.findMany({ where: { userId } }),
      prisma.searchPointRule.findMany({ where: { userId }, include: { periods: true } }),
      prisma.notification.findMany({ where: { userId } }),
    ]);

  await audit({ userId, actie: "gegevens.geexporteerd" });

  const payload = {
    geexporteerdOp: new Date().toISOString(),
    account: user,
    profiel: profile,
    zoekprofielen: searchProfiles,
    inschrijvingen: registrations,
    reactielogboek: applications,
    documenten: documents,
    zoekpunten: pointRules,
    meldingen: notifications,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="woningwaker-export-${userId}.json"`,
    },
  });
}
