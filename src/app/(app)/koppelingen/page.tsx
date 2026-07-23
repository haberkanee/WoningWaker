import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { nieuwInboundToken } from "@/lib/inbound";
import { inboundAddressVoor, inboundWebhookUrl, gmailAppsScript } from "@/lib/config";
import { googleConfigured } from "@/lib/google";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/copy-field";
import { CopyBlock } from "@/components/copy-block";
import { PageHeader } from "@/components/page-header";
import { HEADER_IMAGES } from "@/lib/images";
import { REGIOS } from "@/lib/regios";
import { datum } from "@/lib/utils";
import { ontkoppelGmail, haalGmailNu } from "./actions";
import { pollGmailForUser } from "@/lib/gmail-poll";
import { Mail, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Koppelingen" };
export const dynamic = "force-dynamic";

async function ensureToken(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { inboundToken: true } });
  if (u?.inboundToken) return u.inboundToken;
  const token = nieuwInboundToken();
  await prisma.user.update({ where: { id: userId }, data: { inboundToken: token } });
  return token;
}

const GMAIL_MELDING: Record<string, { klasse: string; tekst: string }> = {
  verbonden: { klasse: "border-success/40 bg-success/5", tekst: "Gmail is gekoppeld! We halen automatisch je woningalerts op." },
  mislukt: { klasse: "border-destructive/40 bg-destructive/5", tekst: "Koppelen mislukt. Probeer het opnieuw." },
  herhaal: { klasse: "border-warning/40 bg-warning/5", tekst: "Geef opnieuw toestemming zodat we de koppeling kunnen bewaren." },
  nietgeconfigureerd: { klasse: "border-warning/40 bg-warning/5", tekst: "Google-inloggen is nog niet ingesteld door de beheerder." },
};

export default async function KoppelingenPage({ searchParams }: { searchParams: { gmail?: string } }) {
  const user = await requireUser();
  // Direct na koppelen één keer ophalen zodat je meteen woningen ziet.
  if (searchParams.gmail === "verbonden") {
    await pollGmailForUser(user.id).catch(() => {});
  }
  const [token, dbUser] = await Promise.all([
    ensureToken(user.id),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { gmailEmail: true, gmailConnectedAt: true, gmailLastSyncAt: true },
    }),
  ]);
  const gmailVerbonden = !!dbUser?.gmailEmail;
  const melding = searchParams.gmail ? GMAIL_MELDING[searchParams.gmail] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        titel="Koppelingen"
        ondertitel="Koppel je mailbox en ontvang automatisch échte woningen — geen scraping, geen gedoe."
        image={HEADER_IMAGES.aanbod}
      />

      {melding && (
        <Card className={melding.klasse}>
          <CardContent className="py-4 text-sm">{melding.tekst}</CardContent>
        </Card>
      )}

      {/* Gmail — één klik */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>Koppel met Gmail</CardTitle>
          <CardDescription>Eén klik: inloggen bij Google en klaar. Wij lezen alleen je woningalerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!googleConfigured() ? (
            <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
              De Google-koppeling is nog niet ingesteld op de server. De beheerder moet
              <code className="mx-1">GOOGLE_CLIENT_ID</code> en <code className="mx-1">GOOGLE_CLIENT_SECRET</code>
              configureren (zie DEPLOY.md). Gebruik zolang de handmatige methode onderaan.
            </p>
          ) : gmailVerbonden ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Verbonden met <strong>{dbUser?.gmailEmail}</strong></span>
              </div>
              <p className="text-xs text-muted-foreground">
                Laatste keer opgehaald: {dbUser?.gmailLastSyncAt ? datum(dbUser.gmailLastSyncAt) : "nog niet"}.
                Nieuwe alerts worden automatisch verwerkt.
              </p>
              <div className="flex flex-wrap gap-2">
                <form action={haalGmailNu}>
                  <Button type="submit">Nu ophalen</Button>
                </form>
                <form action={ontkoppelGmail}>
                  <Button type="submit" variant="outline">Ontkoppelen</Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button asChild size="lg">
                <a href="/api/gmail/connect">Koppel met Gmail</a>
              </Button>
              <p className="text-xs text-muted-foreground">
                Je wordt naar Google gestuurd om in te loggen en toestemming te geven
                (alleen-lezen). Zet daarna bij je woningplatform de e-mailalerts aan —
                wij doen de rest.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outlook — binnenkort */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Koppel met Outlook</CardTitle>
              <CardDescription>Voor Outlook/Hotmail-gebruikers.</CardDescription>
            </div>
            <Badge variant="secondary">Binnenkort</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Handmatige methode (zonder inloggen) */}
      <details className="rounded-lg border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Geavanceerd: handmatig koppelen (zonder Google in te loggen)
        </summary>
        <div className="mt-4 space-y-4 text-sm text-muted-foreground">
          <p>
            Liever geen Google-toestemming? Plak dit Google Apps Script op{" "}
            <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">script.google.com</a>{" "}
            (label je alerts eerst met een Gmail-filter als “WoningWaker”) en zet een trigger elke 5–10 min.
          </p>
          <CopyBlock value={gmailAppsScript(token)} taal="javascript" />
          <p>Je persoonlijke webhook-URL (deel deze niet):</p>
          <CopyField value={inboundWebhookUrl(token)} />
          {inboundAddressVoor(token) && (
            <>
              <p>Of stuur alerts door naar je persoonlijke adres (via een inbound-provider):</p>
              <CopyField value={inboundAddressVoor(token)!} />
            </>
          )}
        </div>
      </details>

      <Card>
        <CardHeader>
          <CardTitle>Ondersteunde regio's</CardTitle>
          <CardDescription>We herkennen automatisch van welk platform de alert komt.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {REGIOS.map((r) => (
            <Badge key={r.slug} variant="secondary">{r.naam} · {r.platform}</Badge>
          ))}
          <Badge variant="outline"><Mail className="mr-1 h-3 w-3" />Andere platforms ook mogelijk</Badge>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        We halen zelf niets van de platforms af (geen scraping) en lezen alleen je
        woningalerts — nooit je overige e-mail. Je kunt de koppeling altijd verbreken.
      </p>
    </div>
  );
}
