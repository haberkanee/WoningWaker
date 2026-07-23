import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { nieuwInboundToken } from "@/lib/inbound";
import { inboundAddressVoor, inboundWebhookUrl, gmailAppsScript } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyField } from "@/components/copy-field";
import { CopyBlock } from "@/components/copy-block";
import { PageHeader } from "@/components/page-header";
import { HEADER_IMAGES } from "@/lib/images";
import { REGIOS } from "@/lib/regios";
import { Mail, Zap } from "lucide-react";

export const metadata: Metadata = { title: "Koppelingen" };
export const dynamic = "force-dynamic";

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
  const script = gmailAppsScript(token);
  const webhookUrl = inboundWebhookUrl(token);

  return (
    <div className="space-y-6">
      <PageHeader
        titel="Koppelingen"
        ondertitel="Ontvang échte woningen door de officiële e-mailalerts van de platforms door te sturen — geen scraping."
        image={HEADER_IMAGES.aanbod}
      />

      {/* Methode 1: Gmail (aanbevolen) */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <CardTitle>Gmail-koppeling (aanbevolen)</CardTitle>
              <CardDescription>Werkt met je gewone Gmail — geen extra account of domein nodig.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">1. Label je alerts in Gmail.</strong> Maak een Gmail-filter
              (Instellingen → Filters → Nieuw filter) voor de afzender van je woningalerts
              (bijv. <code>@woonnetrijnmond.nl</code>) en kies <em>“Label toepassen: WoningWaker”</em>.
              Maak dat label eenmalig aan.
            </li>
            <li>
              <strong className="text-foreground">2. Voeg het script toe.</strong> Ga naar{" "}
              <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">script.google.com</a>{" "}
              → <em>Nieuw project</em>, plak onderstaande code en sla op. Draai <code>woningwakerSync</code>
              één keer en geef toestemming.
              <div className="mt-2"><CopyBlock value={script} taal="javascript" /></div>
            </li>
            <li>
              <strong className="text-foreground">3. Zet een trigger.</strong> In het script-project:
              <em> Triggers</em> (klokje) → <em>Trigger toevoegen</em> → functie <code>woningwakerSync</code>,
              tijdgestuurd, elke 5 of 10 minuten. Klaar — nieuwe alerts verschijnen automatisch als echte woning.
            </li>
          </ol>
          <div className="rounded-md bg-accent/50 p-3 text-xs text-accent-foreground">
            Je persoonlijke webhook-URL zit al in het script verwerkt. Deel deze niet met anderen:
            <div className="mt-2"><CopyField value={webhookUrl} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Methode 2: doorstuuradres */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Mail className="h-4 w-4" />
            </span>
            <div>
              <CardTitle>Doorstuuradres (Postmark / CloudMailin)</CardTitle>
              <CardDescription>Alternatief als je een inbound-e-mailprovider gebruikt.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {adres ? (
            <>
              <p className="text-sm text-muted-foreground">Stuur je alerts naar dit persoonlijke adres:</p>
              <CopyField value={adres} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Deze methode is nog niet geconfigureerd op de server (<code>INBOUND_BASE_ADDRESS</code> ontbreekt).
              Gebruik de Gmail-koppeling hierboven — die werkt zonder extra provider.
            </p>
          )}
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
        e-mailalerts; jij bepaalt wat je doorstuurt. Je token is persoonlijk en geheim.
      </p>
    </div>
  );
}
