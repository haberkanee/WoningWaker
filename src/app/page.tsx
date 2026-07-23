import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import { HERO_IMAGE, HEADER_IMAGES } from "@/lib/images";
import { REGIOS } from "@/lib/regios";
import {
  Home, ShieldCheck, Sparkles, Target, ClipboardList, Bell,
  ArrowRight, CheckCircle2, MapPin,
} from "lucide-react";

const FUNCTIES = [
  { icon: Home, titel: "Alle platforms, één overzicht", tekst: "Woningen uit meerdere regio's en woningplatforms bij elkaar — met filters, favorieten en notities." },
  { icon: ShieldCheck, titel: "Past deze woning bij jou?", tekst: "We checken inkomen, huishouden, leeftijd en voorwaarden en leggen uit waaróm je wel of niet in aanmerking komt." },
  { icon: Sparkles, titel: "Drie eerlijke scores", tekst: "Geschiktheid, woonwens en een realistische kansindicatie — altijd met de redenen erbij, geen valse hoop." },
  { icon: Target, titel: "ZoekpuntWaker", tekst: "Houd per regio bij hoeveel reacties je deze maand nog nodig hebt vóór de deadline." },
  { icon: ClipboardList, titel: "Inschrijvingen bewaakt", tekst: "Verlengingen, betalingen en profielchecks op tijd — je verliest nooit meer je inschrijfduur." },
  { icon: Bell, titel: "Meteen bruikbare meldingen", tekst: "Push, e-mail of Telegram met scores, prijs en sluitingstijd. Geen ruis, geen dubbele alerts." },
];

const STAPPEN = [
  { nr: "1", titel: "Vul je profiel in", tekst: "Inkomen, huishouden, wensen en inschrijvingen — eenmalig." },
  { nr: "2", titel: "Wij zoeken en beoordelen", tekst: "We verzamelen het aanbod, checken de voorwaarden en scoren elke woning voor jóu." },
  { nr: "3", titel: "Jij reageert zelf", tekst: "Wij bereiden alles voor; jij klikt op het officiële platform op ‘Definitief reageren’." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="bg-hero-fallback absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(180deg, hsl(214 48% 16% / 0.82), hsl(220 40% 12% / 0.92)), url('${HERO_IMAGE}')` }}
          />
          <div className="container relative py-24 md:py-32">
            <div className="max-w-2xl text-white">
              <Badge className="mb-5 border-white/20 bg-white/10 text-white backdrop-blur">
                Sociale huur, slim geregeld
              </Badge>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Jouw sociale huurwoning, eindelijk overzichtelijk
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/85">
                Woonbot vindt advertenties. <strong className="text-white">WoningWaker begrijpt
                het volledige sociale-huurproces:</strong> welke woning bij je past, waar je de
                beste kansen hebt en wat je vandaag moet doen.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="gold">
                  <Link href="/registreren">Gratis starten <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  <Link href="/prijzen">Bekijk de pakketten</Link>
                </Button>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-white/70">
                <ShieldCheck className="h-4 w-4" /> Nooit automatisch reageren — jij houdt de controle.
              </p>
            </div>
          </div>
        </section>

        {/* Trust / regio's */}
        <section className="border-b bg-card">
          <div className="container flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Actief in:</span>
            {REGIOS.map((r) => (
              <span key={r.slug} className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gold" /> {r.naam}
              </span>
            ))}
          </div>
        </section>

        {/* Voorbeeldmelding + functies */}
        <section id="functies" className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Van eerste alert tot getekend contract</h2>
            <p className="mt-4 text-muted-foreground">
              WoningWaker denkt met je mee bij elke stap — niet alleen bij het vinden.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FUNCTIES.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.titel} className="border-border/70">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{f.titel}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.tekst}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Hoe het werkt */}
        <section className="border-y bg-secondary/50">
          <div className="container grid items-center gap-12 py-20 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">Zo werkt het</h2>
              <p className="mt-4 text-muted-foreground">In drie stappen van zoeken naar reageren.</p>
              <div className="mt-8 space-y-6">
                {STAPPEN.map((s) => (
                  <div key={s.nr} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                      {s.nr}
                    </div>
                    <div>
                      <h3 className="font-semibold">{s.titel}</h3>
                      <p className="text-sm text-muted-foreground">{s.tekst}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Card className="overflow-hidden border-primary/20 shadow-lg">
              <div
                className="bg-hero-fallback h-40 bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(0deg, hsl(214 48% 16% / 0.35), transparent), url('${HEADER_IMAGES.proces}')` }}
              />
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Nieuwe lotingwoning in Rotterdam</p>
                  <Badge variant="success">Waarschijnlijk geschikt</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">Loting</Badge>
                  <Badge variant="outline">Woonwens 92%</Badge>
                  <Badge variant="warning">Sluit over 19 uur</Badge>
                </div>
                <p className="text-sm text-muted-foreground">€682 p/m · 2 kamers · 64 m² · Delfshaven</p>
                <div className="rounded-lg bg-accent/60 p-3 text-sm text-accent-foreground">
                  💡 Loting: als eerste reageren geeft geen extra kans — maar reageer wél op tijd.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Veiligheid */}
        <section className="container py-20">
          <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 text-center shadow-sm md:p-12">
            <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Veilig en volgens de regels</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              WoningWaker zoekt, filtert, controleert en meldt — en bereidt je reactie voor.
              De <strong className="text-foreground">definitieve reactie dien je altijd zelf in</strong> op
              het officiële platform. Geen CAPTCHA-omzeiling, geen verborgen automatisering,
              geen agressieve scraping.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {["Jij houdt de controle", "Officiële platforms", "AVG-proof"].map((t) => (
                <span key={t} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" /> {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-primary text-primary-foreground">
          <div className="container flex flex-col items-center gap-6 py-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Begin vandaag nog</h2>
            <p className="max-w-md text-primary-foreground/80">
              Gratis in één regio. Upgrade wanneer je wilt. Geen verplichtingen.
            </p>
            <Button asChild size="lg" variant="gold">
              <Link href="/registreren">Maak een gratis account <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
