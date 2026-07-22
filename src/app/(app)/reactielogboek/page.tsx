import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { datum } from "@/lib/utils";
import { regioNaam } from "@/lib/regios";
import { verdeelmodelInfo } from "@/lib/domain/verdeelmodellen";
import { updateApplication, deleteApplication } from "./actions";
import type { ApplicationStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Reactielogboek" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  VOORBEREID: "Voorbereid",
  GEREAGEERD: "Gereageerd",
  UITGENODIGD: "Uitgenodigd",
  BEZICHTIGING: "Bezichtiging",
  AANBOD: "Aanbod",
  AFGEWEZEN: "Afgewezen",
  INGETROKKEN: "Ingetrokken",
  VERLOPEN: "Verlopen",
};

const STATUS_VARIANT: Record<ApplicationStatus, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  VOORBEREID: "secondary",
  GEREAGEERD: "default",
  UITGENODIGD: "success",
  BEZICHTIGING: "success",
  AANBOD: "success",
  AFGEWEZEN: "destructive",
  INGETROKKEN: "secondary",
  VERLOPEN: "warning",
};

export default async function ReactielogboekPage() {
  const user = await requireUser();
  if (!can(user.plan as never, "reactielogboek")) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Reactielogboek</h1>
        <Card className="border-primary/30 bg-accent/30">
          <CardContent className="space-y-3 py-6">
            <p>Het reactielogboek is onderdeel van het <strong>Waker</strong>-pakket.</p>
            <Button asChild><Link href="/instellingen">Upgrade naar Waker</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const logs = await prisma.applicationLog.findMany({
    where: { userId: user.id },
    orderBy: { gevondenOp: "desc" },
  });

  const stats = {
    totaal: logs.length,
    uitnodigingen: logs.filter((l) => l.uitnodiging).length,
    aanbiedingen: logs.filter((l) => l.aanbod).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reactielogboek</h1>
        <p className="text-muted-foreground">Alle reacties, uitnodigingen en resultaten op één plek.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.totaal}</p><p className="text-sm text-muted-foreground">Reacties totaal</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.uitnodigingen}</p><p className="text-sm text-muted-foreground">Uitnodigingen</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.aanbiedingen}</p><p className="text-sm text-muted-foreground">Aanbiedingen</p></CardContent></Card>
      </div>

      {logs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nog geen reacties. Zodra je via de reactieassistent reageert, verschijnen ze hier.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {logs.map((l) => (
            <Card key={l.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {l.listingId ? (
                        <Link href={`/woningen/${l.listingId}`} className="hover:underline">{l.woningTitel}</Link>
                      ) : l.woningTitel}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {regioNaam(l.regio)} · {l.platformSlug} · {verdeelmodelInfo(l.verdeelmodel).label}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[l.status]}>{STATUS_LABEL[l.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span>Gevonden: {datum(l.gevondenOp)}</span>
                  <span>Gereageerd: {datum(l.gereageerdOp)}</span>
                  {l.positie != null && <span>Positie: {l.positie}</span>}
                  {l.woonwensScore != null && <span>Woonwens: {l.woonwensScore}%</span>}
                </div>
                <form action={updateApplication} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={l.id} />
                  <select name="status" defaultValue={l.status} className="h-9 rounded-md border border-input bg-card px-2 text-sm">
                    {Object.entries(STATUS_LABEL).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                  <Input name="positie" type="number" placeholder="Positie" defaultValue={l.positie ?? ""} className="h-9 w-28" />
                  <Input name="notities" placeholder="Notitie" defaultValue={l.notities ?? ""} className="h-9 flex-1 min-w-[160px]" />
                  <Button size="sm" type="submit" variant="outline">Bijwerken</Button>
                </form>
                <form action={deleteApplication.bind(null, l.id)}>
                  <Button size="sm" type="submit" variant="ghost">Verwijder uit logboek</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
