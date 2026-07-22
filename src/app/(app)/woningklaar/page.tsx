import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { datum } from "@/lib/utils";
import { updateDocument, addMedeaanvrager } from "./actions";
import type { DocumentStatus, DocumentType } from "@prisma/client";

export const metadata: Metadata = { title: "WoningKlaar" };
export const dynamic = "force-dynamic";

const DOC_LABELS: Record<DocumentType, string> = {
  INKOMENSVERKLARING: "Inkomensverklaring (Belastingdienst)",
  LOONSTROOK: "Recente loonstroken",
  JAAROPGAVE: "Jaaropgave",
  BRP_UITTREKSEL: "BRP-uittreksel",
  VERHUURDERSVERKLARING: "Verhuurdersverklaring",
  IDENTITEITSBEWIJS: "Identiteitsbewijs",
  MEDEAANVRAGER: "Documenten medeaanvrager",
};

const STATUS_VARIANT: Record<DocumentStatus, "success" | "warning" | "secondary" | "destructive"> = {
  AANWEZIG: "success",
  AANGEVRAAGD: "warning",
  ONTBREEKT: "secondary",
  VERLOPEN: "destructive",
};

export default async function WoningKlaarPage() {
  const user = await requireUser();
  if (!can(user.plan as never, "woningKlaar")) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">WoningKlaar</h1>
        <Card className="border-primary/30 bg-accent/30">
          <CardContent className="space-y-3 py-6">
            <p>WoningKlaar is onderdeel van <strong>Waker Plus</strong>.</p>
            <Button asChild><Link href="/instellingen">Upgrade naar Waker Plus</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const documenten = await prisma.documentChecklistItem.findMany({
    where: { userId: user.id },
    orderBy: [{ voorMedeaanvrager: "asc" }, { type: "asc" }],
  });
  const compleet = documenten.filter((d) => d.status === "AANWEZIG").length;
  const eigen = documenten.filter((d) => !d.voorMedeaanvrager);
  const mede = documenten.filter((d) => d.voorMedeaanvrager);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">WoningKlaar</h1>
        <p className="text-muted-foreground">
          Houd je documenten klaar zodat je direct kunt reageren. We bewaren alleen
          status en verloopdatum — geen documenten zelf.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Voortgang</span>
            <span>{compleet}/{documenten.length} compleet</span>
          </div>
          <Progress value={documenten.length ? (compleet / documenten.length) * 100 : 0} indicatorClassName="bg-success" />
        </CardContent>
      </Card>

      <DocLijst titel="Mijn documenten" documenten={eigen} />

      {mede.length > 0 ? (
        <DocLijst titel="Medeaanvrager" documenten={mede} />
      ) : (
        <form action={addMedeaanvrager}>
          <Button variant="outline" type="submit">+ Medeaanvrager toevoegen</Button>
        </form>
      )}
    </div>
  );
}

function DocLijst({
  titel,
  documenten,
}: {
  titel: string;
  documenten: Awaited<ReturnType<typeof prisma.documentChecklistItem.findMany>>;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{titel}</CardTitle>
        <CardDescription>Werk de status en eventuele verloopdatum bij.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {documenten.map((d) => (
          <form key={d.id} action={updateDocument} className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
            <input type="hidden" name="type" value={d.type} />
            <input type="hidden" name="voorMedeaanvrager" value={d.voorMedeaanvrager ? "1" : "0"} />
            <div className="min-w-[180px] flex-1">
              <p className="text-sm font-medium">{DOC_LABELS[d.type]}</p>
              {d.verloopt && (
                <p className="text-xs text-muted-foreground">Verloopt: {datum(d.verloopt)}</p>
              )}
            </div>
            <Badge variant={STATUS_VARIANT[d.status]}>{d.status.toLowerCase()}</Badge>
            <select name="status" defaultValue={d.status} className="h-9 rounded-md border border-input bg-card px-2 text-sm">
              <option value="ONTBREEKT">Ontbreekt</option>
              <option value="AANGEVRAAGD">Aangevraagd</option>
              <option value="AANWEZIG">Aanwezig</option>
              <option value="VERLOPEN">Verlopen</option>
            </select>
            <input
              name="verloopt"
              type="date"
              defaultValue={d.verloopt ? d.verloopt.toISOString().slice(0, 10) : ""}
              className="h-9 rounded-md border border-input bg-card px-2 text-sm"
            />
            <Button size="sm" type="submit" variant="outline">Bijwerken</Button>
          </form>
        ))}
      </CardContent>
    </Card>
  );
}
