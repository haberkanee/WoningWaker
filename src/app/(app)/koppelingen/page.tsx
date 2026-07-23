import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { nieuwInboundToken } from "@/lib/inbound";
import { inboundAddressVoor, INBOUND_BASE_ADDRESS } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyField } from "@/components/copy-field";
import { PageHeader } from "@/components/page-header";
import { HEADER_IMAGES } from "@/lib/images";
import { REGIOS } from "@/lib/regios";

export const metadata: Metadata = { title: "Koppelingen" };
export const dynamic = "force-dynamic";

/** Zorgt dat de gebruiker een persoonlijk inbound-token heeft. */
async function ensureToken(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { inboundToken: true } });
  if (u?.inboundToken) return u.inboundToken;
  const token = nieuwInboundToken();
  await prisma.user.update({ where: { id: userId }, data: { inboundToken: token } });
  return token;
}

export default async function KoppelingenPage() {
  const user = await requireUser();
  const token = await ensureToken(user.id);
  const adres = inboundAddressVoor(token);

  return (
    <div className="space-y-6">
      <PageHeader
        titel="Koppelingen"
        ondertitel="Ontvang echte woningen door de officiële e-mailalerts van de platforms door te sturen."
        image={HEADER_IMAGES.aanbod}
      />

      <Card>
        <CardHeader>
          <CardTitle>Jouw persoonlijke doorstuuradres</CardTitle>
          <CardDescription>
            Alerts die je hierheen doorstuurt, worden automatisch echte woningen in je aanbod —
            met de echte advertentielink en foto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {adres ? (
            <CopyField value={adres} />
          ) : (
            <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
              Het inbound-adres is nog niet ingesteld op de server. De beheerder moet eerst
              <code className="mx-1">INBOUND_BASE_ADDRESS</code> en
              <code className="mx-1">INBOUND_WEBHOOK_SECRET</code> configureren (zie DEPLOY.md).
              Je persoonlijke token is alvast aangemaakt: <code>{token}</code>.
            </div>
          )}

          <div>
            <h3 className="mb-2 font-semibold">Zo stel je het in</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li><strong>1.</strong> Log in bij een woningplatform en zet de <em>e-mailalerts / nieuw aanbod-mail</em> aan (bijv. bij Woonnet Rijnmond of Woonkeus/Mijn DAK).</li>
              <li><strong>2.</strong> Stel in je eigen mailbox een <em>automatische doorstuurregel</em> in: alle alerts van dat platform → naar bovenstaand adres.</li>
              <li><strong>3.</strong> Klaar. Elke nieuwe alert verschijnt binnen enkele seconden als echte woning in je aanbod, met een geschiktheids- en woonwensscore.</li>
            </ol>
          </div>

          <div className="rounded-md bg-accent/50 p-3 text-sm text-accent-foreground">
            💡 Tip: je kunt ook per zoekprofiel bij het platform een aparte alert instellen — alles komt op één plek binnen.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ondersteunde regio's</CardTitle>
          <CardDescription>We herkennen automatisch van welk platform de alert komt.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {REGIOS.map((r) => (
            <Badge key={r.slug} variant="secondary">{r.naam} · {r.platform}</Badge>
          ))}
          <Badge variant="outline">Andere platforms via e-mail ook mogelijk</Badge>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        We halen zelf niets van de platforms af (geen scraping). Je gebruikt de officiële
        e-mailalerts van de platforms; jij bepaalt wat je doorstuurt.
      </p>
    </div>
  );
}
