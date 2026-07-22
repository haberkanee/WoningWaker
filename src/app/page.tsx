import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

const FUNCTIES = [
  { titel: "Centraal woningaanbod", tekst: "Woningen van meerdere platforms en regio's in één overzicht — met filters, favorieten en notities." },
  { titel: "Geschiktheidscontrole", tekst: "We checken inkomen, huishouden, leeftijd en voorwaarden en leggen uit waarom je wel of niet past." },
  { titel: "Drie scores", tekst: "Geschiktheid, woonwens en een eerlijke kansindicatie — altijd met de redenen erbij." },
  { titel: "Verdeelmodellen uitgelegd", tekst: "Loting, inschrijfduur of Direct Kans? We leggen uit waar snelheid telt en waar niet." },
  { titel: "ZoekpuntWaker", tekst: "Houd per regio bij hoeveel reacties je deze maand nog nodig hebt vóór de deadline." },
  { titel: "Inschrijvingsmanager", tekst: "Bewaak inschrijvingen, verlengingen en betalingen zodat je nooit je plek verliest." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="container py-20 text-center">
          <Badge variant="secondary" className="mb-4">Sociale huur, slim geregeld</Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Vind sociale huurwoningen uit heel Nederland — op één plek
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Woonbot vindt advertenties. <strong className="text-foreground">WoningWaker begrijpt
            het volledige sociale-huurproces:</strong> welke woning bij je past, waar je de beste
            kansen hebt en wat je vandaag moet doen.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/registreren">Gratis starten</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/prijzen">Bekijk de pakketten</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Geen automatisch reageren zonder jouw toestemming — jij houdt de controle.
          </p>
        </section>

        {/* Voorbeeldmelding */}
        <section className="container pb-8">
          <Card className="mx-auto max-w-md border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Nieuwe lotingwoning in Rotterdam</CardTitle>
                <Badge variant="success">Waarschijnlijk geschikt</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>Woonwensscore: <strong className="text-foreground">92%</strong></p>
              <p>€682 per maand · 2 kamers</p>
              <p>Sluit over 19 uur</p>
            </CardContent>
          </Card>
        </section>

        {/* Functies */}
        <section id="functies" className="container py-16">
          <h2 className="text-center text-3xl font-bold">Alles voor je woningzoektocht</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Van het eerste aanbod tot je reactielogboek — WoningWaker denkt met je mee.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FUNCTIES.map((f) => (
              <Card key={f.titel}>
                <CardHeader>
                  <CardTitle className="text-lg">{f.titel}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{f.tekst}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Veiligheid */}
        <section className="border-y bg-accent/40">
          <div className="container py-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold">Veilig en volgens de regels</h2>
              <p className="mt-4 text-muted-foreground">
                WoningWaker zoekt, filtert, controleert en meldt — en bereidt je reactie voor.
                De <strong className="text-foreground">definitieve reactie dien je altijd zelf in</strong> op
                het officiële platform, nadat je op <em>Definitief reageren</em> hebt geklikt. Geen
                CAPTCHA-omzeiling, geen verborgen automatisering, geen agressieve scraping.
              </p>
            </div>
          </div>
        </section>

        <section className="container py-16 text-center">
          <h2 className="text-3xl font-bold">Begin vandaag nog</h2>
          <p className="mt-3 text-muted-foreground">Gratis in één regio. Upgrade wanneer je wilt.</p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/registreren">Maak een gratis account</Link>
          </Button>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
