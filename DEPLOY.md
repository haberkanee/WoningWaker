# WoningWaker online zetten (deployment)

Deze gids zet WoningWaker live op een **echte, openbare URL**. De aanbevolen
route is **Vercel** (de makers van Next.js) met een gratis gehoste PostgreSQL van
**Neon**. Je hebt geen creditcard nodig voor de gratis pakketten.

Totale tijd: ~15 minuten.

---

## Route A — Vercel + Neon (aanbevolen)

### Stap 1 — Zet je code op GitHub

De code staat al in de repo. Zorg dat de branch die je wilt deployen op GitHub
staat (bijv. `main`, of de feature-branch). Vercel deployt vanaf GitHub.

### Stap 2 — Maak een gratis PostgreSQL bij Neon

1. Ga naar <https://neon.tech> en maak een gratis account.
2. Maak een nieuw project (regio: kies bijvoorbeeld *EU (Frankfurt)*).
3. Kopieer de **connection string**. Gebruik de **direct** connection string
   (niet de "pooled"), bijvoorbeeld:
   ```
   postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Bewaar deze — dit wordt je `DATABASE_URL`.

### Stap 3 — Importeer het project in Vercel

1. Ga naar <https://vercel.com/new> en log in met GitHub.
2. Kies de WoningWaker-repository → **Import**.
3. Bij *Configure Project* → open **Environment Variables** en zet minimaal:

   | Naam | Waarde |
   |------|--------|
   | `DATABASE_URL` | de Neon-connection string uit stap 2 |
   | `AUTH_SECRET` | een lange willekeurige string — genereer met `openssl rand -base64 32` |
   | `ADMIN_EMAIL` | het e-mailadres waarmee jij admin wilt worden |
   | `CRON_SECRET` | een willekeurige string (beveiligt de sync-cron) |

   > Vercel gebruikt automatisch `npm run vercel-build`, dat de database-migratie
   > (`prisma migrate deploy`) uitvoert vóór de build. Je hoeft dus niets handmatig
   > te migreren.

4. Klik **Deploy** en wacht tot de build klaar is. Je krijgt een URL zoals
   `https://woningwaker-xxxx.vercel.app`.

### Stap 4 — Vul de eerste data

Je database is nu leeg. Twee opties:

**Optie 1 — via de app (aanbevolen):**
1. Ga naar `https://<jouw-url>/registreren` en registreer met hetzelfde e-mailadres
   als `ADMIN_EMAIL`. Je wordt automatisch admin.
2. Ga naar `/admin` → klik **Sync connectors nu**. De demo-woningen worden geladen
   en matches berekend.

**Optie 2 — demo-data seeden vanaf je eigen computer:**
```bash
# éénmalig, met de productie-DATABASE_URL:
DATABASE_URL="postgresql://...neon..." npm run db:seed
```
Dit maakt een admin- en demo-account aan (`Demo1234`) en laadt testwoningen.

### Stap 5 — (optioneel) Automatische sync

`vercel.json` bevat al een dagelijkse cron die `/api/connectors/sync` aanroept.
Zolang je `CRON_SECRET` hebt gezet, stuurt Vercel automatisch het juiste
`Authorization`-token mee — er is verder niets te configureren.

> De gratis (Hobby) Vercel-cron draait maximaal 1×/dag. Wil je vaker syncen, dan
> kan dat met een Pro-account (pas de `schedule` in `vercel.json` aan) of via de
> knop **Sync connectors nu** in `/admin`.

---

## Optionele integraties (later toe te voegen als env-variabelen)

Alles hieronder is optioneel — zonder deze keys werkt de app gewoon, maar de
betreffende functie is uit.

| Functie | Variabelen |
|--------|-----------|
| Pushmeldingen | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — genereer met `npx web-push generate-vapid-keys` |
| E-mail (Resend) | `RESEND_API_KEY`, `EMAIL_FROM` |
| Telegram | `TELEGRAM_BOT_TOKEN` |
| Betalingen (Mollie, aanbevolen) | `MOLLIE_API_KEY` |
| Betalingen (Stripe, alternatief) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_WAKER`, `STRIPE_PRICE_WAKER_PLUS` |

Zonder betaal-keys werken de upgradeknoppen in *demo-modus* (ze schakelen het plan
direct om), zodat je alle pakket-functies kunt testen.

### Mollie instellen (iDEAL, geld naar je eigen rekening)

1. Maak een account op [mollie.com](https://www.mollie.com) en rond de onboarding
   af (bankrekening = waar je uitbetaling heen gaat). Activeer iDEAL en
   *Recurring payments / SEPA-incasso*.
2. Kopieer je API-key (Dashboard → Developers → API-keys). Gebruik `test_…` om te
   testen en `live_…` voor echt geld.
3. Zet in Vercel de variabele `MOLLIE_API_KEY` en **Redeploy**.
4. Klaar: de upgradeknop opent nu een Mollie-betaalpagina (iDEAL/creditcard). Na
   de eerste betaling maakt WoningWaker automatisch een maandabonnement aan en
   int Mollie elke maand. De webhook `/api/mollie/webhook` verwerkt dit —
   die moet publiek bereikbaar zijn (op Vercel automatisch het geval).

> Let op: Mollie accepteert geen `localhost`-webhook. Test betalingen daarom op je
> Vercel-URL, niet lokaal. Lokaal blijft de demo-modus actief.

Voeg variabelen toe via **Vercel → Project → Settings → Environment Variables** en
klik daarna **Redeploy**.

---

## Route B — Render / Railway / eigen server (Docker)

Wil je ook de **achtergrondworker** (BullMQ) draaien voor realtime bewaking, dan
heb je een platform nodig dat een langlopende Node-server draait. Er is een
`Dockerfile` en `docker-compose.yml` meegeleverd.

1. Maak een PostgreSQL- en (optioneel) Redis-instance bij je platform.
2. Zet de env-variabelen (zie tabel hierboven + `DATABASE_URL`, `AUTH_SECRET`,
   `REDIS_URL`).
3. Build & start:
   ```bash
   npm ci
   npm run build
   npm run db:deploy      # prisma migrate deploy
   npm run start          # productieserver
   npm run worker         # (aparte proces) sync + verloopbewaking
   ```
   Of gebruik het `Dockerfile` rechtstreeks.

---

## Veelgestelde vragen

**"Prisma kan niet verbinden tijdens de build."**
Controleer of `DATABASE_URL` correct in Vercel staat en gebruik de **direct**
connection string van Neon (niet de pooled/pgbouncer-variant) voor migraties.

**"Ik zie geen woningen."**
De database is leeg tot de eerste sync. Log in als admin en klik **Sync
connectors nu**, of run `npm run db:seed` tegen je productie-database.

**"Kan ik een eigen domein gebruiken?"**
Ja — voeg het toe onder **Vercel → Project → Settings → Domains**.
