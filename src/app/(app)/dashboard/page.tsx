import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureUserData } from "@/lib/matching";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GeschiktheidBadge, KansBadge } from "@/components/scores";
import { euro, tijdTot, datum } from "@/lib/utils";
import { berekenZoekpuntStatus, huidigeJaarMaand } from "@/lib/domain/zoekpunten";
import { regioNaam } from "@/lib/regios";
import { PageHeader } from "@/components/page-header";
import { HEADER_IMAGES } from "@/lib/images";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  await ensureUserData(user.id);
  const { jaar, maand } = huidigeJaarMaand();
  const maandStart = new Date(jaar, maand - 1, 1);

  const [
    matches, hiddenRows, reactiesDezeMaand, pointPeriods, registraties,
    documenten, gemisteDeadlines, tips,
  ] = await Promise.all([
    prisma.listingMatch.findMany({ where: { userId: user.id }, include: { listing: true } }),
    prisma.hiddenListing.findMany({ where: { userId: user.id }, select: { listingId: true } }),
    prisma.applicationLog.count({
      where: { userId: user.id, gereageerdOp: { gte: maandStart }, status: { not: "VOORBEREID" } },
    }),
    prisma.searchPointPeriod.findMany({
      where: { userId: user.id, jaar, maand },
      include: { rule: true },
    }),
    prisma.platformRegistration.findMany({ where: { userId: user.id } }),
    prisma.documentChecklistItem.findMany({ where: { userId: user.id } }),
    prisma.applicationLog.count({
      where: { userId: user.id, status: "VERLOPEN" },
    }),
    berekenRegioTips(user.id),
  ]);

  const hidden = new Set(hiddenRows.map((h) => h.listingId));
  const zichtbaar = matches.filter((m) => !hidden.has(m.listingId));

  const nieuw = [...zichtbaar]
    .sort((a, b) => b.listing.gepubliceerdOp.getTime() - a.listing.gepubliceerdOp.getTime())
    .slice(0, 4);
  const beste = [...zichtbaar]
    .filter((m) => m.geschiktheidStatus === "WAARSCHIJNLIJK_GESCHIKT")
    .sort((a, b) => b.woonwensScore - a.woonwensScore)
    .slice(0, 4);
  const directKans = zichtbaar.filter((m) => m.listing.verdeelmodel === "DIRECT_KANS");
  const bijnaSluiten = zichtbaar
    .filter((m) => m.listing.sluitDatum && m.listing.sluitDatum.getTime() > Date.now())
    .sort((a, b) => (a.listing.sluitDatum!.getTime()) - (b.listing.sluitDatum!.getTime()))
    .slice(0, 4);

  // Waarschuwingen inschrijvingen (verlengdatum < 30 dagen)
  const nu = Date.now();
  const inschrijvingWaarschuwingen = registraties.filter(
    (r) => r.verlengdatum && r.verlengdatum.getTime() - nu < 30 * 86_400_000,
  );
  const docsCompleet = documenten.filter((d) => d.status === "AANWEZIG").length;

  return (
    <div className="space-y-6">
      <PageHeader
        titel={`Welkom terug${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        ondertitel="Dit is wat er vandaag speelt in jouw woningzoektocht."
        image={HEADER_IMAGES.dashboard}
      />

      {/* Kerncijfers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Nieuwe matches" value={zichtbaar.length} href="/woningen" />
        <Stat label="Reacties deze maand" value={reactiesDezeMaand} href="/reactielogboek" />
        <Stat label="Direct Kans-woningen" value={directKans.length} href="/woningen?model=DIRECT_KANS" />
        <Stat label="Documenten compleet" value={`${docsCompleet}/${documenten.length}`} href="/woningklaar" />
      </div>

      {/* Zoekpunten */}
      {pointPeriods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ZoekpuntWaker · {new Date(jaar, maand - 1).toLocaleDateString("nl-NL", { month: "long" })}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {pointPeriods.map((p) => {
              const s = berekenZoekpuntStatus({
                regio: p.rule.regio, jaar, maand, doel: p.doel, behaald: p.behaald, deadline: p.deadline,
              });
              return (
                <div key={p.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{regioNaam(p.rule.regio)}</span>
                    <Badge variant={s.voltooid ? "success" : "warning"}>
                      {s.behaald}/{s.doel}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.samenvatting}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Waarschuwingen */}
      {(inschrijvingWaarschuwingen.length > 0 || gemisteDeadlines > 0) && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader><CardTitle className="text-lg">Let op</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {inschrijvingWaarschuwingen.map((r) => (
              <p key={r.id}>
                ⚠️ Inschrijving <strong>{r.platformNaam}</strong> verloopt op {datum(r.verlengdatum)}.{" "}
                <Link href="/inschrijvingen" className="text-primary underline">Beheer</Link>
              </p>
            ))}
            {gemisteDeadlines > 0 && <p>⏰ Je hebt {gemisteDeadlines} gemiste deadline(s).</p>}
          </CardContent>
        </Card>
      )}

      {/* Uitlegbare tips */}
      {tips.length > 0 && (
        <Card className="border-primary/30 bg-accent/30">
          <CardHeader><CardTitle className="text-lg">Slimme tips</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {tips.map((t, i) => (<p key={i}>💡 {t}</p>))}
          </CardContent>
        </Card>
      )}

      {/* Beste matches */}
      <MatchSectie titel="Beste matches" leeg="Nog geen geschikte matches — vul je profiel aan." matches={beste} />
      <MatchSectie titel="Nieuw in het aanbod" leeg="Nog geen nieuwe woningen." matches={nieuw} />
      {bijnaSluiten.length > 0 && (
        <MatchSectie titel="Sluit binnenkort" leeg="" matches={bijnaSluiten} toonSluit />
      )}
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="p-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

type MatchWithListing = Awaited<ReturnType<typeof prisma.listingMatch.findMany>>[number] & {
  listing: NonNullable<Awaited<ReturnType<typeof prisma.listing.findUnique>>>;
};

function MatchSectie({
  titel, leeg, matches, toonSluit,
}: {
  titel: string; leeg: string; matches: MatchWithListing[]; toonSluit?: boolean;
}) {
  if (matches.length === 0 && !leeg) return null;
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">{titel}</h2>
      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">{leeg}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => (
            <Link key={m.id} href={`/woningen/${m.listing.id}`}>
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{m.listing.titel ?? m.listing.plaats}</p>
                    <GeschiktheidBadge status={m.geschiktheidStatus} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {m.listing.plaats} · {euro(m.listing.huurprijs)} · {m.listing.kamers ?? "?"} kamers
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Woonwens {m.woonwensScore}%</Badge>
                    <KansBadge indicatie={m.kansindicatie} />
                    {toonSluit && m.listing.sluitDatum && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Sluit over {tijdTot(m.listing.sluitDatum)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Regiotips op basis van aandeel geschikte woningen per regio. */
async function berekenRegioTips(userId: string): Promise<string[]> {
  const matches = await prisma.listingMatch.findMany({
    where: { userId },
    include: { listing: { select: { regio: true } } },
  });
  const perRegio = new Map<string, { totaal: number; geschikt: number }>();
  for (const m of matches) {
    const regio = m.listing.regio ?? "onbekend";
    const e = perRegio.get(regio) ?? { totaal: 0, geschikt: 0 };
    e.totaal++;
    if (m.geschiktheidStatus === "WAARSCHIJNLIJK_GESCHIKT") e.geschikt++;
    perRegio.set(regio, e);
  }
  const ranked = [...perRegio.entries()]
    .filter(([, v]) => v.totaal >= 2)
    .map(([regio, v]) => ({ regio, ratio: v.geschikt / v.totaal }))
    .sort((a, b) => b.ratio - a.ratio);

  const tips: string[] = [];
  if (ranked.length >= 2) {
    const beste = ranked[0];
    const slechtste = ranked[ranked.length - 1];
    if (beste.ratio > slechtste.ratio) {
      tips.push(
        `In ${regioNaam(beste.regio)} vind je vaker woningen waarvoor je waarschijnlijk geschikt bent dan in ${regioNaam(slechtste.regio)}.`,
      );
    }
  }
  if (ranked.length === 1 && ranked[0].ratio > 0.5) {
    tips.push(`In ${regioNaam(ranked[0].regio)} pas je op veel woningen — mooie kansen daar.`);
  }
  return tips;
}
