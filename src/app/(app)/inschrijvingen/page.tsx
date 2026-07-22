import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { datum } from "@/lib/utils";
import { REGIOS, regioNaam } from "@/lib/regios";
import { connectors } from "@/lib/connectors/registry";
import { saveRegistration, deleteRegistration } from "./actions";

export const metadata: Metadata = { title: "Inschrijvingen" };
export const dynamic = "force-dynamic";

export default async function InschrijvingenPage() {
  const user = await requireUser();
  const registraties = await prisma.platformRegistration.findMany({
    where: { userId: user.id },
    orderBy: { verlengdatum: "asc" },
  });
  const nu = Date.now();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inschrijvingsmanager</h1>
        <p className="text-muted-foreground">
          Bewaak je platforminschrijvingen, inschrijfduur en verlengingsdatums.
        </p>
      </div>

      {registraties.length === 0 ? (
        <p className="text-sm text-muted-foreground">Je hebt nog geen inschrijvingen toegevoegd.</p>
      ) : (
        <div className="grid gap-3">
          {registraties.map((r) => {
            const verloopt = r.verlengdatum && r.verlengdatum.getTime() - nu < 30 * 86_400_000;
            const jaren = r.inschrijfdatum
              ? Math.floor((nu - r.inschrijfdatum.getTime()) / (365.25 * 86_400_000))
              : null;
            return (
              <Card key={r.id} className={verloopt ? "border-warning/50" : ""}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{r.platformNaam}</p>
                      <Badge variant={r.status === "ACTIEF" ? "success" : r.status === "ACTIE_NODIG" ? "warning" : "secondary"}>
                        {r.status === "ACTIE_NODIG" ? "Actie nodig" : r.status === "ACTIEF" ? "Actief" : "Inactief"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.regio ? regioNaam(r.regio) : "—"}
                      {r.inschrijfnummer ? ` · nr. ${r.inschrijfnummer}` : ""}
                      {jaren != null ? ` · ${jaren} jaar ingeschreven` : ""}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Ingeschreven: {datum(r.inschrijfdatum)} · Verlengen: {datum(r.verlengdatum)}
                      {verloopt && <span className="ml-1 text-warning-foreground font-medium">— verloopt binnenkort!</span>}
                    </p>
                    {r.actieNodig && <p className="mt-1 text-sm text-warning-foreground">Actie: {r.actieNodig}</p>}
                  </div>
                  <form action={deleteRegistration.bind(null, r.id)}>
                    <Button size="sm" variant="ghost" type="submit">Verwijder</Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Inschrijving toevoegen</CardTitle></CardHeader>
        <CardContent>
          <form action={saveRegistration} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="platformNaam">Platform</Label>
              <Input id="platformNaam" name="platformNaam" list="platforms" placeholder="Woonnet Rijnmond" required />
              <datalist id="platforms">
                {connectors.map((c) => <option key={c.slug} value={c.naam} />)}
              </datalist>
              <input type="hidden" name="platformSlug" value="overig" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="regio">Regio</Label>
              <select id="regio" name="regio" className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option value="">—</option>
                {REGIOS.map((r) => <option key={r.slug} value={r.slug}>{r.naam}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inschrijfnummer">Inschrijfnummer</Label>
              <Input id="inschrijfnummer" name="inschrijfnummer" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option value="ACTIEF">Actief</option>
                <option value="ACTIE_NODIG">Actie nodig</option>
                <option value="INACTIEF">Inactief</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inschrijfdatum">Inschrijfdatum</Label>
              <Input id="inschrijfdatum" name="inschrijfdatum" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="verlengdatum">Verlengingsdatum</Label>
              <Input id="verlengdatum" name="verlengdatum" type="date" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="actieNodig">Benodigde actie (optioneel)</Label>
              <Input id="actieNodig" name="actieNodig" placeholder="Inkomen bijwerken" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Inschrijving toevoegen</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
