import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { REGIOS, regioNaam } from "@/lib/regios";
import { euro } from "@/lib/utils";
import { createSearchProfile, deleteSearchProfile, toggleSearchProfile } from "./actions";

export const metadata: Metadata = { title: "Zoekprofielen" };
export const dynamic = "force-dynamic";

const MODELLEN = [
  ["LOTING", "Loting"], ["INSCHRIJFDUUR", "Inschrijfduur"], ["DIRECT_KANS", "Direct Kans"],
  ["JONGERENWONING", "Jongerenwoning"], ["SENIORENWONING", "Seniorenwoning"], ["LOKALE_VOORRANG", "Lokale voorrang"],
] as const;

export default async function ZoekprofielenPage() {
  const user = await requireUser();
  const profielen = await prisma.searchProfile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const magMeerdere = can(user.plan as never, "meerdereZoekprofielen");
  const magNieuw = magMeerdere || profielen.length < 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zoekprofielen</h1>
        <p className="text-muted-foreground">
          Bewaar meerdere zoekopdrachten, bijvoorbeeld "Rotterdam onder €700" of "Lotingwoningen".
        </p>
      </div>

      {profielen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Je hebt nog geen zoekprofielen.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {profielen.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.naam}</CardTitle>
                  <Badge variant={p.actief ? "success" : "secondary"}>{p.actief ? "Actief" : "Uit"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{p.regios.length ? p.regios.map(regioNaam).join(", ") : "Alle regio's"}</p>
                <p>
                  {p.maxHuurprijs ? `Max ${euro(p.maxHuurprijs)}` : "Geen prijslimiet"}
                  {p.minKamers ? ` · ≥${p.minKamers} kamers` : ""}
                  {p.alleenGeschikt ? " · alleen geschikt" : ""}
                </p>
                {p.verdeelmodellen.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.verdeelmodellen.map((m) => <Badge key={m} variant="outline">{m}</Badge>)}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <form action={toggleSearchProfile.bind(null, p.id)}>
                    <Button size="sm" variant="outline" type="submit">{p.actief ? "Pauzeer" : "Activeer"}</Button>
                  </form>
                  <form action={deleteSearchProfile.bind(null, p.id)}>
                    <Button size="sm" variant="ghost" type="submit">Verwijder</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nieuw zoekprofiel</CardTitle>
          {!magNieuw && (
            <CardDescription className="text-warning-foreground">
              Gratis staat één zoekprofiel toe.{" "}
              <Link href="/instellingen" className="underline">Upgrade naar Waker</Link> voor meer.
            </CardDescription>
          )}
        </CardHeader>
        {magNieuw && (
          <CardContent>
            <form action={createSearchProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="naam">Naam</Label>
                <Input id="naam" name="naam" placeholder="Rotterdam onder €700" required />
              </div>
              <div>
                <Label>Regio's</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {REGIOS.map((r) => (
                    <label key={r.slug} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                      <input type="checkbox" name="regios" value={r.slug} /> {r.naam}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Max huurprijs (€)" name="maxHuurprijs" type="number" />
                <Field label="Min kamers" name="minKamers" type="number" />
                <Field label="Min oppervlakte (m²)" name="minOppervlakte" type="number" />
              </div>
              <div>
                <Label>Verdeelmodellen</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {MODELLEN.map(([v, l]) => (
                    <label key={v} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                      <input type="checkbox" name="verdeelmodellen" value={v} /> {l}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="alleenGeschikt" /> Alleen geschikte woningen
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="liftVereist" /> Lift vereist
                </label>
              </div>
              <Button type="submit">Zoekprofiel opslaan</Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} />
    </div>
  );
}
