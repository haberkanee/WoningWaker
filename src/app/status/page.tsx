import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { connectors } from "@/lib/connectors/registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import { datum } from "@/lib/utils";

export const metadata: Metadata = { title: "Platformstatus" };
export const dynamic = "force-dynamic";

export default async function StatusPage() {
  let statussen: Awaited<ReturnType<typeof prisma.connectorStatus.findMany>> = [];
  try {
    statussen = await prisma.connectorStatus.findMany();
  } catch {
    statussen = [];
  }
  const byslug = new Map(statussen.map((s) => [s.platformSlug, s]));

  const rijen = connectors.map((c) => {
    const s = byslug.get(c.slug);
    return {
      slug: c.slug,
      naam: c.naam,
      bron: c.bron,
      gezond: s?.gezond ?? true,
      laatsteSync: s?.laatsteSync ?? null,
      aantal: s?.aantalWoningen ?? 0,
      fout: s?.laatsteFout ?? null,
    };
  });

  const allesGezond = rijen.every((r) => r.gezond);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="container flex-1 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Platformstatus</h1>
            <Badge variant={allesGezond ? "success" : "warning"}>
              {allesGezond ? "Alle systemen operationeel" : "Verstoring gedetecteerd"}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            Live status van onze platformconnectors. Demo-connectors gebruiken testdata.
          </p>

          <div className="mt-8 space-y-3">
            {rijen.map((r) => (
              <Card key={r.slug}>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base">{r.naam}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Bron: {r.bron} · {r.aantal} woningen · laatste sync {datum(r.laatsteSync)}
                    </p>
                  </div>
                  <Badge variant={r.gezond ? "success" : "destructive"}>
                    {r.gezond ? "Operationeel" : "Verstoord"}
                  </Badge>
                </CardHeader>
                {r.fout && (
                  <CardContent className="pt-0 text-xs text-destructive">{r.fout}</CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
