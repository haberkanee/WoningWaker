import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBar, RedenenLijst, GeschiktheidBadge, KansBadge } from "@/components/scores";
import { ReactieAssistent } from "@/components/reactie-assistent";
import { verdeelmodelInfo } from "@/lib/domain/verdeelmodellen";
import { DISCLAIMER, type Reden } from "@/lib/domain/types";
import { euro, datum, tijdTot } from "@/lib/utils";
import { regioNaam } from "@/lib/regios";
import { bevestigDefinitiefGereageerd } from "./actions";

export const metadata: Metadata = { title: "Woningdetails" };
export const dynamic = "force-dynamic";

export default async function WoningDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) notFound();

  const [match, application] = await Promise.all([
    prisma.listingMatch.findUnique({
      where: { userId_listingId: { userId: user.id, listingId: listing.id } },
    }),
    prisma.applicationLog.findFirst({
      where: { userId: user.id, listingId: listing.id, status: { in: ["GEREAGEERD", "UITGENODIGD", "BEZICHTIGING", "AANBOD"] } },
    }),
  ]);

  const vm = verdeelmodelInfo(listing.verdeelmodel);
  const nogBeschikbaar = !listing.sluitDatum || listing.sluitDatum.getTime() > Date.now();

  const geschiktRedenen = (match?.geschiktheidRedenen as Reden[] | undefined) ?? [];
  const woonwensRedenen = (match?.woonwensRedenen as Reden[] | undefined) ?? [];
  const kansRedenen = (match?.kansRedenen as Reden[] | undefined) ?? [];

  const ontbrekend = geschiktRedenen.filter((r) => r.ok === "onbekend").map((r) => r.tekst);

  return (
    <div className="space-y-6">
      <Link href="/woningen" className="text-sm text-muted-foreground hover:underline">
        ← Terug naar aanbod
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Kop */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-xl">
                    {listing.titel ?? `${listing.woningtype} in ${listing.plaats}`}
                  </CardTitle>
                  <CardDescription>
                    {listing.plaats}{listing.wijk ? ` · ${listing.wijk}` : ""} ·{" "}
                    {regioNaam(listing.regio)} · {listing.corporatie ?? "—"}
                  </CardDescription>
                </div>
                {match && <GeschiktheidBadge status={match.geschiktheidStatus} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <Kenmerk label="Kale huur" value={euro(listing.huurprijs)} />
                <Kenmerk label="Servicekosten" value={euro(listing.servicekosten)} />
                <Kenmerk label="Oppervlakte" value={listing.oppervlakte ? `${listing.oppervlakte} m²` : "—"} />
                <Kenmerk label="Kamers" value={listing.kamers?.toString() ?? "—"} />
                <Kenmerk label="Woningtype" value={typeLabel(listing.woningtype)} />
                <Kenmerk label="Platform" value={listing.platformSlug} />
                <Kenmerk label="Gepubliceerd" value={datum(listing.gepubliceerdOp)} />
                <Kenmerk
                  label="Sluit"
                  value={listing.sluitDatum ? `${datum(listing.sluitDatum)} (${tijdTot(listing.sluitDatum)})` : "—"}
                />
                <Kenmerk label="Lift/begane grond" value={liftLabel(listing.heeftLift, listing.beganeGrond)} />
              </div>
              {listing.omschrijving && (
                <p className="text-sm text-muted-foreground">{listing.omschrijving}</p>
              )}
            </CardContent>
          </Card>

          {/* Verdeelmodel */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Verdeelmodel: {vm.label}</CardTitle>
                {vm.snelheidBelangrijk && <Badge variant="warning">Snelheid telt</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{vm.uitleg}</p>
              <p className="rounded-md bg-accent/50 p-3 text-accent-foreground">💡 {vm.tip}</p>
            </CardContent>
          </Card>

          {/* Reactieassistent */}
          <ReactieAssistent
            listingId={listing.id}
            bronUrl={listing.bronUrl}
            nogBeschikbaar={nogBeschikbaar}
            ontbrekendeInfo={ontbrekend}
            alGereageerd={!!application}
            bevestigAction={bevestigDefinitiefGereageerd}
          />
        </div>

        {/* Scores zijkolom */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">De drie scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {match ? (
                <>
                  <ScoreBar label="Geschiktheidsscore" score={match.geschiktheidScore} />
                  <ScoreBar label="Woonwensscore" score={match.woonwensScore} kleur="bg-success" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Kansindicatie</span>
                    <KansBadge indicatie={match.kansindicatie} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Vul je <Link href="/profiel" className="text-primary underline">profiel</Link> in
                  voor persoonlijke scores.
                </p>
              )}
              <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
                {DISCLAIMER}
              </p>
            </CardContent>
          </Card>

          {match && (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Waarom geschikt?</CardTitle></CardHeader>
                <CardContent><RedenenLijst redenen={geschiktRedenen} /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Waarom deze woonwensscore?</CardTitle></CardHeader>
                <CardContent><RedenenLijst redenen={woonwensRedenen} /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Waarom deze kansindicatie?</CardTitle></CardHeader>
                <CardContent><RedenenLijst redenen={kansRedenen} /></CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Kenmerk({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function typeLabel(t: string): string {
  return t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, " ");
}
function liftLabel(lift: boolean | null, bg: boolean | null): string {
  if (bg) return "Begane grond";
  if (lift) return "Met lift";
  if (lift === false) return "Geen lift";
  return "Onbekend";
}
