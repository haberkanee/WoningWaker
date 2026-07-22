import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { syncAllConnectors } from "../src/lib/connectors/sync";
import { recomputeMatchesForUser } from "../src/lib/matching";
import { laatsteDagVanMaand, huidigeJaarMaand } from "../src/lib/domain/zoekpunten";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Connectors synchroniseren…");
  const sync = await syncAllConnectors();
  console.log(`  ${sync.reduce((a, s) => a + s.aantal, 0)} woningen geladen.`);

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@woningwaker.nl").toLowerCase();
  const demoEmail = "demo@woningwaker.nl";
  const wachtwoord = await bcrypt.hash("Demo1234", 12);

  // Admin
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Beheerder",
      passwordHash: wachtwoord,
      role: "ADMIN",
      plan: "WAKER_PLUS",
      subscription: { create: { plan: "WAKER_PLUS", status: "ACTIVE" } },
    },
  });
  console.log(`  Admin: ${adminEmail} / Demo1234`);

  // Demo-gebruiker met volledig profiel
  const demo = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: "Demi Demo",
      passwordHash: wachtwoord,
      role: "USER",
      plan: "WAKER_PLUS",
      subscription: { create: { plan: "WAKER_PLUS", status: "ACTIVE" } },
      profile: {
        create: {
          brutoJaarinkomen: 38000,
          huishoudgrootte: 2,
          leeftijd: 31,
          huidigeWoonplaats: "Rotterdam",
          gewensteRegios: ["rotterdam", "drechtsteden"],
          gewensteGemeenten: ["Rotterdam", "Dordrecht", "Schiedam"],
          maxHuurprijs: 750,
          minKamers: 2,
          woningtypes: ["APPARTEMENT", "EENGEZINSWONING", "BENEDENWONING"],
          lokaleBinding: ["Rotterdam"],
        },
      },
      documents: {
        create: [
          { type: "INKOMENSVERKLARING", status: "AANWEZIG" },
          { type: "LOONSTROOK", status: "AANWEZIG" },
          { type: "JAAROPGAVE", status: "AANGEVRAAGD" },
          { type: "BRP_UITTREKSEL", status: "ONTBREEKT" },
          { type: "VERHUURDERSVERKLARING", status: "ONTBREEKT" },
          { type: "IDENTITEITSBEWIJS", status: "AANWEZIG", verloopt: new Date(Date.now() + 40 * 86_400_000) },
        ],
      },
    },
  });
  console.log(`  Demo: ${demoEmail} / Demo1234`);

  // Inschrijvingen
  await prisma.platformRegistration.deleteMany({ where: { userId: demo.id } });
  await prisma.platformRegistration.createMany({
    data: [
      {
        userId: demo.id, platformSlug: "rijnmond", platformNaam: "Woonnet Rijnmond",
        regio: "rotterdam", status: "ACTIEF",
        inschrijfdatum: new Date(Date.now() - 8 * 365 * 86_400_000),
        verlengdatum: new Date(Date.now() + 20 * 86_400_000),
        inschrijfnummer: "RIJ-889231",
      },
      {
        userId: demo.id, platformSlug: "dak", platformNaam: "Mijn DAK",
        regio: "drechtsteden", status: "ACTIE_NODIG",
        inschrijfdatum: new Date(Date.now() - 2 * 365 * 86_400_000),
        verlengdatum: new Date(Date.now() + 10 * 86_400_000),
        actieNodig: "Inkomensgegevens bijwerken",
      },
    ],
  });

  // Zoekpuntregels
  const { jaar, maand } = huidigeJaarMaand();
  for (const regio of ["rotterdam", "drechtsteden"]) {
    const rule = await prisma.searchPointRule.upsert({
      where: { userId_regio: { userId: demo.id, regio } },
      update: {},
      create: {
        userId: demo.id, regio, reactiesPerMaand: 4,
        tellendeModellen: ["LOTING", "INSCHRIJFDUUR", "DIRECT_KANS"],
      },
    });
    await prisma.searchPointPeriod.upsert({
      where: { ruleId_jaar_maand: { ruleId: rule.id, jaar, maand } },
      update: {},
      create: {
        ruleId: rule.id, userId: demo.id, jaar, maand,
        doel: 4, behaald: regio === "rotterdam" ? 3 : 1,
        deadline: laatsteDagVanMaand(jaar, maand),
      },
    });
  }

  console.log("→ Matches berekenen…");
  await recomputeMatchesForUser(demo.id);

  console.log("✓ Seed voltooid.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
