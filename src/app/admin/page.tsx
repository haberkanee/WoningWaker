import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { connectors } from "@/lib/connectors/registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { datum } from "@/lib/utils";
import { triggerSync, leegAanbod } from "./actions";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [users, listings, applications, subscriptions, connectorStatus, recenteAudit] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.applicationLog.count(),
    prisma.user.groupBy({ by: ["plan"], _count: true }),
    prisma.connectorStatus.findMany(),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
  ]);
  const statusMap = new Map(connectorStatus.map((s) => [s.platformSlug, s]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Adminomgeving</h1>
        <div className="flex gap-2">
          <form action={leegAanbod}>
            <Button type="submit" variant="outline">Leeg het aanbod (wis demodata)</Button>
          </form>
          <form action={triggerSync}>
            <Button type="submit">Sync connectors nu</Button>
          </form>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Zie je nog oude demodata? Klik op <strong>Leeg het aanbod</strong> — dat verwijdert alle
        woningen. Met demodata uit (standaard) komt er alleen echte data terug via de e-mailkoppeling.
      </p>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Gebruikers" value={users} />
        <Stat label="Woningen" value={listings} />
        <Stat label="Reacties" value={applications} />
        <Stat label="Betaald" value={subscriptions.filter((s) => s.plan !== "GRATIS").reduce((a, s) => a + s._count, 0)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Plannen</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {subscriptions.map((s) => (
            <Badge key={s.plan} variant="secondary">{s.plan}: {s._count}</Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Connectors</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {connectors.map((c) => {
            const s = statusMap.get(c.slug);
            return (
              <div key={c.slug} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                <div>
                  <span className="font-medium">{c.naam}</span>
                  <span className="ml-2 text-muted-foreground">({c.bron})</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{s?.aantalWoningen ?? 0} woningen</span>
                  <span>{s?.laatsteSync ? datum(s.laatsteSync) : "nooit"}</span>
                  <Badge variant={s?.gezond === false ? "destructive" : "success"}>
                    {s?.gezond === false ? "Verstoord" : "OK"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recente auditlogs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1.5 text-sm">
            {recenteAudit.length === 0 && <p className="text-muted-foreground">Nog geen auditlogs.</p>}
            {recenteAudit.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b py-1.5 last:border-0">
                <span>{a.actie}{a.entiteit ? ` · ${a.entiteit}` : ""}</span>
                <span className="text-xs text-muted-foreground">{datum(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </CardContent></Card>
  );
}
