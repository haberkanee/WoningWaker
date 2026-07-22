import { Queue } from "bullmq";
import { getRedis } from "@/lib/redis";

/**
 * BullMQ-queues voor achtergrondwerk (connector-sync, meldingen). Optioneel:
 * zonder Redis geven de helpers `null` en degraderen we naar inline-uitvoering.
 */
export const QUEUE_SYNC = "woningwaker:sync";
export const QUEUE_NOTIFY = "woningwaker:notify";

let syncQueue: Queue | null | undefined;

export function getSyncQueue(): Queue | null {
  if (syncQueue !== undefined) return syncQueue;
  const connection = getRedis();
  syncQueue = connection ? new Queue(QUEUE_SYNC, { connection }) : null;
  return syncQueue;
}

/** Plan een sync in via de queue, of voer inline uit als er geen Redis is. */
export async function scheduleSync(): Promise<"queued" | "inline"> {
  const q = getSyncQueue();
  if (q) {
    await q.add("sync", {}, { removeOnComplete: 50, removeOnFail: 50 });
    return "queued";
  }
  const { syncAllConnectors } = await import("@/lib/connectors/sync");
  await syncAllConnectors();
  return "inline";
}
