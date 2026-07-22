/**
 * BullMQ-worker. Draai met `npm run worker`. Verwerkt sync-jobs (connectors +
 * matchherberekening) en periodieke bewaking (inschrijvingen/documenten die
 * verlopen). Vereist Redis; zonder Redis stopt de worker netjes.
 */
import { Worker } from "bullmq";
import { getRedis } from "@/lib/redis";
import { QUEUE_SYNC } from "./index";
import { syncAllConnectors } from "@/lib/connectors/sync";
import { prisma } from "@/lib/prisma";
import { recomputeMatchesForUser } from "@/lib/matching";
import { notify } from "@/lib/notifications";
import { datum } from "@/lib/utils";

async function main() {
  const connection = getRedis();
  if (!connection) {
    console.warn("[worker] Geen REDIS_URL — worker gestopt. Gebruik de /api/connectors/sync route i.p.v. de queue.");
    return;
  }

  const worker = new Worker(
    QUEUE_SYNC,
    async () => {
      console.log("[worker] sync gestart");
      await syncAllConnectors();
      const users = await prisma.user.findMany({ select: { id: true } });
      for (const u of users) await recomputeMatchesForUser(u.id).catch(() => {});
      await bewaakVerlopers();
      console.log(`[worker] sync klaar voor ${users.length} gebruikers`);
    },
    { connection },
  );

  worker.on("failed", (job, err) => console.error("[worker] job mislukt", job?.id, err));
  console.log("[worker] draait, wacht op sync-jobs…");
}

/** Stuur waarschuwingen voor inschrijvingen/documenten die binnen 30 dagen verlopen. */
async function bewaakVerlopers() {
  const grens = new Date(Date.now() + 30 * 86_400_000);

  const registraties = await prisma.platformRegistration.findMany({
    where: { verlengdatum: { lte: grens, gte: new Date() } },
  });
  for (const r of registraties) {
    await notify({
      userId: r.userId,
      type: "INSCHRIJVING_VERLOOPT",
      titel: `Inschrijving ${r.platformNaam} verloopt binnenkort`,
      body: `Verleng je inschrijving vóór ${datum(r.verlengdatum)} om je plek te behouden.`,
      url: "/inschrijvingen",
      dedupeKey: `inschrijving-verloopt:${r.id}:${r.verlengdatum?.toISOString().slice(0, 10)}`,
    }).catch(() => {});
  }

  const documenten = await prisma.documentChecklistItem.findMany({
    where: { verloopt: { lte: grens, gte: new Date() } },
  });
  for (const d of documenten) {
    await notify({
      userId: d.userId,
      type: "DOCUMENT_VERLOOPT",
      titel: `Document verloopt binnenkort`,
      body: `Je ${d.type.toLowerCase()} verloopt op ${datum(d.verloopt)}. Vernieuw het op tijd.`,
      url: "/woningklaar",
      dedupeKey: `document-verloopt:${d.id}:${d.verloopt?.toISOString().slice(0, 10)}`,
    }).catch(() => {});
  }
}

main().catch((err) => {
  console.error("[worker] fatale fout", err);
  process.exit(1);
});
