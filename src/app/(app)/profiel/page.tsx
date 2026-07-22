import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { saveProfile } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { REGIOS } from "@/lib/regios";

export const metadata: Metadata = { title: "Profiel" };

const WONINGTYPES = [
  ["APPARTEMENT", "Appartement"],
  ["EENGEZINSWONING", "Eengezinswoning"],
  ["STUDIO", "Studio"],
  ["BENEDENWONING", "Benedenwoning"],
  ["BOVENWONING", "Bovenwoning"],
  ["SENIORENWONING", "Seniorenwoning"],
] as const;

const VOORRANG = [
  ["medisch", "Medische urgentie"],
  ["doorstromer", "Doorstromer"],
  ["mantelzorg", "Mantelzorg"],
  ["sociaal", "Sociale urgentie"],
] as const;

export default async function ProfielPage({
  searchParams,
}: {
  searchParams: { welkom?: string };
}) {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mijn profiel</h1>
        <p className="text-muted-foreground">
          Hoe completer je profiel, hoe beter we je geschiktheid en kansen kunnen inschatten.
        </p>
      </div>

      {searchParams.welkom && (
        <Card className="border-primary/40 bg-accent/40">
          <CardContent className="py-4 text-sm">
            Welkom bij WoningWaker! Vul je profiel in om persoonlijke matches en scores te krijgen.
          </CardContent>
        </Card>
      )}

      <form action={saveProfile} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Jouw situatie</CardTitle>
            <CardDescription>Gebruikt voor de geschiktheidscontrole.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Bruto jaarinkomen huishouden (€)" name="brutoJaarinkomen" type="number" defaultValue={profile?.brutoJaarinkomen ?? ""} />
            <Field label="Huishoudgrootte (personen)" name="huishoudgrootte" type="number" defaultValue={profile?.huishoudgrootte ?? ""} />
            <Field label="Leeftijd" name="leeftijd" type="number" defaultValue={profile?.leeftijd ?? ""} />
            <Field label="Huidige woonplaats" name="huidigeWoonplaats" defaultValue={profile?.huidigeWoonplaats ?? ""} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Woonwensen</CardTitle>
            <CardDescription>Gebruikt voor de woonwensscore en filters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Gewenste regio's</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {REGIOS.map((r) => (
                  <label key={r.slug} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <input
                      type="checkbox"
                      name="gewensteRegios"
                      value={r.slug}
                      defaultChecked={profile?.gewensteRegios.includes(r.slug)}
                    />
                    {r.naam}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Gewenste gemeenten (komma-gescheiden)" name="gewensteGemeenten" defaultValue={profile?.gewensteGemeenten.join(", ") ?? ""} />
              <Field label="Maximale huurprijs (€/maand)" name="maxHuurprijs" type="number" defaultValue={profile?.maxHuurprijs ?? ""} />
              <Field label="Minimaal aantal kamers" name="minKamers" type="number" defaultValue={profile?.minKamers ?? ""} />
              <Field label="Maximale reisafstand (km)" name="maxReisafstandKm" type="number" defaultValue={profile?.maxReisafstandKm ?? ""} />
            </div>

            <div>
              <Label>Woningtype</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {WONINGTYPES.map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <input type="checkbox" name="woningtypes" value={val} defaultChecked={profile?.woningtypes.includes(val)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="liftVereist" defaultChecked={profile?.liftVereist} /> Lift vereist
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="beganeGrondVereist" defaultChecked={profile?.beganeGrondVereist} /> Begane grond vereist
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="studerend" defaultChecked={profile?.studerend} /> Ik studeer
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voorrang & binding</CardTitle>
            <CardDescription>Voor lokale voorrang en doelgroepwoningen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Lokale binding met gemeenten (komma-gescheiden)" name="lokaleBinding" defaultValue={profile?.lokaleBinding.join(", ") ?? ""} />
            <div>
              <Label>Voorrangsredenen</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {VOORRANG.map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <input type="checkbox" name="voorrangsredenen" value={val} defaultChecked={profile?.voorrangsredenen.includes(val)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Profiel opslaan</Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} />
    </div>
  );
}
