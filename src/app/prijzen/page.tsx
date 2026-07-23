import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Prijzen" };

export default function PrijzenPage() {
  const plans = [PLANS.GRATIS, PLANS.WAKER, PLANS.WAKER_PLUS];
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="container flex-1 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Kies je pakket</h1>
          <p className="mt-3 text-muted-foreground">
            Start gratis. Upgrade voor meer regio's, directe meldingen en extra bewaking.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.key} className={plan.key === "WAKER" ? "border-primary shadow-md" : ""}>
              <CardHeader>
                {plan.key === "WAKER" && <Badge className="mb-2 w-fit">Populair</Badge>}
                <CardTitle className="text-xl">{plan.naam}</CardTitle>
                <p className="mt-2 text-3xl font-bold">
                  {plan.prijsLabel}
                  {plan.prijs > 0 && <span className="text-sm font-normal text-muted-foreground"> /maand</span>}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-success">✓</span>
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={plan.key === "WAKER" ? "default" : "outline"}>
                  <Link href="/registreren">{plan.prijs === 0 ? "Gratis starten" : `Kies ${plan.naam}`}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          Prijzen zijn inclusief btw. Maandelijks opzegbaar. Betaling via Mollie — iDEAL, creditcard of automatische incasso.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
