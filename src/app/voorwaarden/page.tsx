import type { Metadata } from "next";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export const metadata: Metadata = { title: "Algemene voorwaarden" };

export default function VoorwaardenPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="container flex-1 py-12">
        <article className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold">Algemene voorwaarden</h1>
          <p className="mt-2 text-sm text-muted-foreground">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL")}</p>
          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. De dienst</h2>
              <p>WoningWaker is een hulpmiddel dat sociale huurwoningen verzamelt, beoordeelt en je huurproces bewaakt. WoningWaker is geen woningcorporatie of woningplatform en verhuurt zelf geen woningen.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Indicaties, geen garanties</h2>
              <p>Geschiktheids-, woonwens- en kansindicaties zijn schattingen op basis van beschikbare informatie. Het woningplatform of de woningcorporatie bepaalt definitief of je in aanmerking komt. Aan de indicaties kunnen geen rechten worden ontleend.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Jij reageert zelf</h2>
              <p>WoningWaker reageert nooit volledig automatisch. Wij bereiden een reactie voor; de definitieve reactie dien je zelf in op het officiële platform. Je bent zelf verantwoordelijk voor het naleven van de regels van dat platform.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Abonnementen</h2>
              <p>Betaalde pakketten worden maandelijks vooraf gefactureerd via Stripe en zijn maandelijks opzegbaar. Bij opzegging loopt je toegang door tot het einde van de betaalde periode.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Aansprakelijkheid</h2>
              <p>WoningWaker is niet aansprakelijk voor gemiste woningen, deadlines of afwijzingen door platforms. Wij spannen ons in voor een betrouwbare dienst maar kunnen geen ononderbroken beschikbaarheid garanderen.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Gebruik</h2>
              <p>Je gebruikt WoningWaker alleen voor je eigen woningzoektocht en niet om platformregels te omzeilen.</p>
            </section>
          </div>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
