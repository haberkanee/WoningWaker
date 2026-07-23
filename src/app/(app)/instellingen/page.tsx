import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PLANS, planConfig, BETAALD_ACTIEF } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { upgradePlan, saveTelegram, deleteAccount, opzeggenAbonnement } from "./actions";
import { NotificatieVoorkeuren } from "./notificatie-voorkeuren";

export const metadata: Metadata = { title: "Instellingen" };
export const dynamic = "force-dynamic";

export default async function InstellingenPage({
  searchParams,
}: {
  searchParams: { upgrade?: string; betaling?: string };
}) {
  const user = await requireUser();
  const [dbUser, prefs, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { plan: true, telegramChatId: true, email: true } }),
    prisma.notificationPreference.findMany({ where: { userId: user.id } }),
    prisma.subscription.findUnique({ where: { userId: user.id } }),
  ]);
  const huidigPlan = planConfig(dbUser?.plan ?? "GRATIS");
  const heeftBetaaldAbonnement = huidigPlan.key !== "GRATIS";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Instellingen</h1>

      {searchParams.upgrade === "ok" && (
        <Card className="border-success/40 bg-success/5"><CardContent className="py-4 text-sm">Je upgrade is gelukt. Bedankt!</CardContent></Card>
      )}

      {searchParams.betaling === "controle" && (
        <Card className="border-primary/40 bg-accent/40"><CardContent className="py-4 text-sm">
          Bedankt! We verwerken je betaling. Zodra Mollie de betaling bevestigt,
          wordt je abonnement automatisch geactiveerd (meestal binnen een minuut).
        </CardContent></Card>
      )}

      {/* Abonnement — alleen tonen als betaalde pakketten actief zijn */}
      {!BETAALD_ACTIEF ? (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
            <div>
              <p className="font-semibold">Alle functies zijn nu gratis 🎉</p>
              <p className="text-sm text-muted-foreground">
                WoningWaker is momenteel volledig gratis — geen pakketten, geen betaling.
              </p>
            </div>
            <Badge variant="success">Gratis</Badge>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
          <CardDescription>Huidig pakket: <Badge>{huidigPlan.naam}</Badge></CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {[PLANS.GRATIS, PLANS.WAKER, PLANS.WAKER_PLUS].map((plan) => (
            <div key={plan.key} className={`rounded-lg border p-4 ${plan.key === huidigPlan.key ? "border-primary bg-accent/30" : ""}`}>
              <p className="font-semibold">{plan.naam}</p>
              <p className="text-2xl font-bold">{plan.prijsLabel}<span className="text-sm font-normal text-muted-foreground">{plan.prijs > 0 ? "/mnd" : ""}</span></p>
              <ul className="my-3 space-y-1 text-xs text-muted-foreground">
                {plan.features.map((f) => <li key={f}>• {f}</li>)}
              </ul>
              {plan.key === huidigPlan.key ? (
                <Badge variant="secondary">Huidig pakket</Badge>
              ) : (
                <form action={upgradePlan}>
                  <input type="hidden" name="plan" value={plan.key} />
                  <Button size="sm" type="submit" variant={plan.prijs > huidigPlan.prijs ? "default" : "outline"}>
                    {plan.prijs > huidigPlan.prijs ? `Upgrade naar ${plan.naam}` : `Wijzig naar ${plan.naam}`}
                  </Button>
                </form>
              )}
            </div>
          ))}
        </CardContent>
        {heeftBetaaldAbonnement && (
          <CardContent className="border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Je hebt een lopend <strong>{huidigPlan.naam}</strong>-abonnement
                {subscription?.currentPeriodEnd
                  ? ` — verlengt automatisch tot ${subscription.currentPeriodEnd.toLocaleDateString("nl-NL")}`
                  : ""}
                . Betalingen verlopen veilig via {subscription?.provider === "mollie" ? "Mollie (iDEAL/incasso)" : "de betaalprovider"}.
              </p>
              <form action={opzeggenAbonnement}>
                <Button type="submit" variant="outline" size="sm">Abonnement opzeggen</Button>
              </form>
            </div>
          </CardContent>
        )}
      </Card>
      )}

      {/* Notificatievoorkeuren */}
      <Card>
        <CardHeader>
          <CardTitle>Meldingsvoorkeuren</CardTitle>
          <CardDescription>Kies per type melding welke kanalen je wilt.</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificatieVoorkeuren
            plan={dbUser?.plan ?? "GRATIS"}
            prefs={prefs.map((p) => ({ type: p.type, channel: p.channel, enabled: p.enabled }))}
          />
        </CardContent>
      </Card>

      {/* Telegram */}
      {(!BETAALD_ACTIEF || planConfig(dbUser?.plan ?? "GRATIS").can.telegram) && (
        <Card>
          <CardHeader><CardTitle>Telegram</CardTitle>
            <CardDescription>Koppel je Telegram chat-ID voor meldingen{BETAALD_ACTIEF ? " (Waker Plus)" : ""}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveTelegram} className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="telegramChatId">Telegram chat-ID</Label>
                <Input id="telegramChatId" name="telegramChatId" defaultValue={dbUser?.telegramChatId ?? ""} placeholder="123456789" />
              </div>
              <Button type="submit">Opslaan</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Privacy: export + verwijderen */}
      <Card>
        <CardHeader><CardTitle>Privacy & gegevens</CardTitle>
          <CardDescription>Exporteer je gegevens of verwijder je account (AVG).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild variant="outline">
            <a href="/api/account/export">Mijn gegevens exporteren (JSON)</a>
          </Button>
          <div className="rounded-lg border border-destructive/40 p-4">
            <p className="font-medium text-destructive">Account verwijderen</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Dit verwijdert je account en alle gegevens permanent. Typ <strong>VERWIJDER</strong> om te bevestigen.
            </p>
            <form action={deleteAccount} className="mt-3 flex items-end gap-2">
              <Input name="bevestiging" placeholder="VERWIJDER" className="w-40" />
              <Button type="submit" variant="destructive">Verwijder mijn account</Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
