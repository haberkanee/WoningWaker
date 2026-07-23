import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import {
  refreshAccessToken, gmailListMessageIds, gmailGetMessage, GMAIL_ZOEKQUERY,
} from "@/lib/google";
import { parseAlertEmail, platformVoorEmail } from "@/lib/inbound";
import { upsertListing } from "@/lib/connectors/sync";
import { recomputeMatchesForUser } from "@/lib/matching";

/** Leest de recente woningalerts uit de Gmail van één gebruiker en verwerkt ze. */
export async function pollGmailForUser(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { gmailRefreshToken: true },
  });
  if (!user?.gmailRefreshToken) return 0;

  const refreshToken = decrypt(user.gmailRefreshToken);
  if (!refreshToken) return 0;

  let accessToken: string;
  try {
    accessToken = await refreshAccessToken(refreshToken);
  } catch {
    return 0; // koppeling verlopen/ingetrokken
  }

  const ids = await gmailListMessageIds(accessToken, GMAIL_ZOEKQUERY, 25);
  let verwerkt = 0;
  for (const id of ids) {
    const msg = await gmailGetMessage(accessToken, id);
    if (!msg) continue;
    const woning = parseAlertEmail({ ...msg, mailboxHash: undefined });
    if (!woning) continue;
    const platform = platformVoorEmail({ ...msg, mailboxHash: undefined });
    await upsertListing(platform.slug, woning);
    verwerkt++;
  }

  if (verwerkt > 0) await recomputeMatchesForUser(userId).catch(() => {});
  await prisma.user.update({ where: { id: userId }, data: { gmailLastSyncAt: new Date() } });
  return verwerkt;
}

/** Poll alle gekoppelde gebruikers (voor de cron). */
export async function pollAllGmail(): Promise<{ users: number; woningen: number }> {
  const users = await prisma.user.findMany({
    where: { gmailRefreshToken: { not: null } },
    select: { id: true },
  });
  let woningen = 0;
  for (const u of users) woningen += await pollGmailForUser(u.id).catch(() => 0);
  return { users: users.length, woningen };
}
