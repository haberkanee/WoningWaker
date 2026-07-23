import type { Metadata } from "next";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";

export const metadata: Metadata = { title: "Privacyverklaring" };

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="container flex-1 py-12">
        <article className="prose mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold">Privacyverklaring</h1>
          <p className="mt-2 text-sm text-muted-foreground">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL")}</p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Wie zijn wij</h2>
              <p>WoningWaker is een hulpmiddel om sociale huurwoningen te vinden en je huurproces te bewaken. Wij zijn géén woningcorporatie of woningplatform.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Welke gegevens verwerken wij</h2>
              <p>Accountgegevens (naam, e-mail), profielgegevens die je zelf invult (inkomen, huishoudgrootte, leeftijd, wensen, inschrijvingen), je reactielogboek en meldingsvoorkeuren. Gevoelige gegevens zoals inkomen bewaren wij versleuteld.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Waarom (grondslag)</h2>
              <p>Wij verwerken deze gegevens om de dienst te leveren (uitvoering van de overeenkomst) en, waar van toepassing, op basis van jouw toestemming (bijvoorbeeld voor meldingen). Je kunt toestemming altijd intrekken.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Bewaartermijn (AVG)</h2>
              <p>Wij bewaren je gegevens zolang je een account hebt. Na verwijdering van je account wissen wij je persoonsgegevens binnen 30 dagen, behalve waar een wettelijke bewaarplicht geldt (bijv. facturatie).</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Jouw rechten</h2>
              <p>Je hebt recht op inzage, correctie, verwijdering en dataportabiliteit. In je accountinstellingen kun je je gegevens exporteren en je account verwijderen.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Delen met derden</h2>
              <p>Wij delen gegevens alleen met verwerkers die nodig zijn voor de dienst (hosting, e-mail via Resend, betalingen via Stripe, meldingen). Wij verkopen je gegevens nooit.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Beveiliging</h2>
              <p>Wij gebruiken veilige authenticatie, versleutelde verbindingen, versleuteling van gevoelige velden en auditlogs. Wachtwoorden en gevoelige gegevens komen nooit in onze logbestanden.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Google-gebruikersdata (Gmail-koppeling)</h2>
              <p>
                Als je ervoor kiest je Gmail te koppelen, vraagt WoningWaker via Google
                uitsluitend <strong>alleen-lezen toegang tot je e-mail</strong> (scope{" "}
                <code>gmail.readonly</code>). We gebruiken die toegang alléén om
                <strong> woningalerts van woningplatforms</strong> te herkennen en om te
                zetten in woningen in je overzicht. We lezen, bewaren of verwerken je
                overige e-mail niet.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>We slaan de inhoud van je e-mails niet op — alleen de daaruit afgeleide woninggegevens (plaats, prijs, link, e.d.).</li>
                <li>Je toegangstoken wordt versleuteld opgeslagen en uitsluitend gebruikt om nieuwe alerts op te halen.</li>
                <li>Er kijken geen medewerkers mee in je mailbox; het verwerken gebeurt geautomatiseerd.</li>
                <li>We verkopen of delen deze gegevens niet en gebruiken ze niet voor advertenties.</li>
                <li>Je kunt de koppeling op elk moment verbreken via <em>Koppelingen → Ontkoppelen</em>; daarmee wordt het token direct verwijderd.</li>
              </ul>
              <p className="mt-3">
                WoningWaker&apos;s gebruik en overdracht van informatie die is ontvangen via
                Google API&apos;s voldoet aan het{" "}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline">
                  Google API Services User Data Policy
                </a>, inclusief de Limited Use-vereisten.
              </p>
              <p className="mt-2 text-xs">
                <em>
                  WoningWaker&apos;s use and transfer of information received from Google APIs to
                  any other app will adhere to the Google API Services User Data Policy,
                  including the Limited Use requirements.
                </em>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
              <p>Vragen over privacy? Mail naar privacy@woningwaker.nl.</p>
            </section>
          </div>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
