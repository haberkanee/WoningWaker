import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { REGIOS, regioNaam } from "@/lib/regios";
import { berekenZoekpuntStatus, huidigeJaarMaand } from "@/lib/domain/zoekpunten";
import { datum } from "@/lib/utils";
import { saveRule, deleteRule } from "./actions";

export const metadata: Metadata = { title: "ZoekpuntWaker" };
export const dynamic = "force-dynamic";

const MODELLEN = [
  ["LOTING", "Loting"], ["INSCHRIJFDUUR", "Inschrijfduur"], ["DIRECT_KANS", "Direct Kans"],
] as const;

export default async function ZoekpuntenPage() {
  const user = await requireUser();
  if (!can(user.plan as never, "zoekpuntWaker")) {
    return <Upgrade />;
  }

  const { jaar, maand } = huidigeJaarMaand();
  const rules = await prisma.searchPointRule.findMany({
    where: { userId: user.id },
    include: { periods: { where: { jaar, maand } } },
  });
  const historie = await prisma.searchPointPeriod.findMany({
    where: { userId: user.id },
    include: { rule: true },
    orderBy: [{ jaar: "desc" }, { maand: "desc" }],
    take: 12,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ZoekpuntWaker</h1>
        <p className="text-muted-foreground">
          Houd per regio bij hoeveel passende reacties je deze maand nog nodig hebt.
        </p>
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">Stel hieronder een regel per regio in.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rules.map((r) => {
            const p = r.periods[0];
            const s = berekenZoekpuntStatus({
              regio: r.regio, jaar, maand,
              doel: p?.doel ?? r.reactiesPerMaand, behaald: p?.behaald ?? 0, deadline: p?.deadline,
            });
            return (
              <Card key={r.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{regioNaam(r.regio)}</CardTitle>
                    <Badge variant={s.voltooid ? "success" : "warning"}>{s.behaald}/{s.doel} reacties</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={s.doel ? (s.behaald / s.doel) * 100 : 0} indicatorClassName={s.voltooid ? "bg-success" : undefined} />
                  <p className="text-sm text-muted-foreground">{s.samenvatting}</p>
                  <p className="text-xs text-muted-foreground">
                    Deadline: {datum(s.deadline)} · nog {s.dagenTot} dagen
                  </p>
                  <form action={deleteRule.bind(null, r.id)}>
                    <Button size="sm" variant="ghost" type="submit">Regel verwijderen</Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Regel instellen / bijwerken</CardTitle>
          <CardDescription>Configureerbaar per regio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveRule} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="regio">Regio</Label>
                <select id="regio" name="regio" required className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                  {REGIOS.map((r) => <option key={r.slug} value={r.slug}>{r.naam}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reactiesPerMaand">Benodigde reacties per maand</Label>
                <Input id="reactiesPerMaand" name="reactiesPerMaand" type="number" defaultValue={4} min={0} max={50} />
              </div>
            </div>
            <div>
              <Label>Welke verdeelmodellen tellen mee</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {MODELLEN.map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="tellendeModellen" value={v} defaultChecked /> {l}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="actief" defaultChecked /> Regel actief
            </label>
            <Button type="submit">Regel opslaan</Button>
          </form>
        </CardContent>
      </Card>

      {historie.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Historie</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {historie.map((h) => {
                const s = berekenZoekpuntStatus({ regio: h.rule.regio, jaar: h.jaar, maand: h.maand, doel: h.doel, behaald: h.behaald, deadline: h.deadline });
                return (
                  <div key={h.id} className="flex items-center justify-between border-b py-1.5 last:border-0">
                    <span>{s.maandLabel} {h.jaar} · {regioNaam(h.rule.regio)}</span>
                    <Badge variant={s.voltooid ? "success" : "secondary"}>{h.behaald}/{h.doel}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Upgrade() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ZoekpuntWaker</h1>
      <Card className="border-primary/30 bg-accent/30">
        <CardContent className="space-y-3 py-6">
          <p>ZoekpuntWaker is onderdeel van het <strong>Waker</strong>-pakket.</p>
          <Button asChild><Link href="/instellingen">Upgrade naar Waker</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
