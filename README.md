# WoningWaker

> Woonbot vindt advertenties. **WoningWaker begrijpt het volledige sociale-huurproces.**

Een SaaS-webapp + PWA die sociale huurwoningen uit meerdere Nederlandse regio's en
platforms op één plek verzamelt, beoordeelt (geschiktheid · woonwens · kans) en het
hele huurproces bewaakt — zonder platformregels te overtreden. Je reageert altijd
zelf op het officiële platform.

Zie [`DESIGN.md`](./DESIGN.md) voor het volledige functioneel & technisch ontwerp.

## Stack

Next.js 14 (App Router) · TypeScript · React 18 · Tailwind + shadcn-stijl UI ·
PostgreSQL + Prisma · Auth.js · Zod · Redis + BullMQ · Web Push · Resend ·
Telegram · Stripe · Vitest + Playwright · Docker Compose · PWA.

## Snel starten (in de browser openen)

**Geen Docker of database-installatie nodig.** Je hebt alleen
[Node.js 20+](https://nodejs.org) op je computer nodig.

```bash
npm install
npm run dev
```

Open daarna **http://localhost:3000** in je browser. That's it.

`npm run dev` regelt alles automatisch: het start een ingebouwde PostgreSQL
(via `embedded-postgres`, opgeslagen in `.postgres/`), zet het databaseschema
klaar, laadt demo-data en start de app. De eerste keer duurt dit iets langer
omdat de database wordt aangemaakt.

> Op Windows: gebruik dezelfde commando's in PowerShell of de terminal.

### Productiemodus lokaal

```bash
npm run build
npm run start:local    # bouwt + start op http://localhost:3000
```

### Eigen database gebruiken (optioneel)

Wil je een eigen PostgreSQL (bijv. via Docker of een cloud-database)? Zet dan
`DATABASE_URL` in een `.env`-bestand (zie `.env.example`); de ingebouwde database
blijft dan uit. Met Docker:

```bash
docker compose up -d db redis   # Postgres + Redis
cp .env.example .env            # zet DATABASE_URL aan
npm run db:push && npm run db:seed
npm run dev
```

Achtergrondworker (optioneel, voor sync & verloopbewaking, vereist Redis):

```bash
npm run worker
```

### Demo-accounts (na seed)

| Rol   | E-mail                  | Wachtwoord |
|-------|-------------------------|------------|
| Admin | `admin@woningwaker.nl`  | `Demo1234` |
| User  | `demo@woningwaker.nl`   | `Demo1234` |

## Online zetten (openbare URL)

Wil je een echte, deelbare URL in plaats van alleen lokaal? Zie de volledige
stap-voor-stap gids in **[`DEPLOY.md`](./DEPLOY.md)**.

Kort samengevat (Vercel + gratis Neon-database):

1. Maak een gratis PostgreSQL bij [Neon](https://neon.tech) en kopieer de
   connection string.
2. Importeer de repo op [vercel.com/new](https://vercel.com/new) en zet de env-vars
   `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `CRON_SECRET`.
3. Deploy. Vercel draait automatisch de database-migratie (`vercel-build`).
4. Registreer met je `ADMIN_EMAIL`, ga naar `/admin` → **Sync connectors nu**.

De meegeleverde `vercel.json` regelt de build en een dagelijkse connector-sync.
Voor een langlopende server mét achtergrondworker: zie Route B (Docker) in
`DEPLOY.md`.

## Environment variables

Alle keys staan in [`.env.example`](./.env.example). **Kern** (verplicht):
`DATABASE_URL`, `AUTH_SECRET`. Alle overige integraties (Redis, Resend,
Web Push/VAPID, Telegram, Stripe) zijn **optioneel** — zonder keys draait de app
in gedegradeerde modus (mock/no-op) zodat de MVP lokaal volledig werkt.

Push-keys genereren: `npx web-push generate-vapid-keys`.

## Scripts

| Script | Doel |
|--------|------|
| `npm run dev` | Dev-server |
| `npm run build` | Prisma generate + productiebuild |
| `npm run db:push` / `db:seed` | Schema pushen / demo-data |
| `npm run worker` | BullMQ-worker (sync + verloopbewaking) |
| `npm test` | Vitest (domeinlogica) |
| `npm run test:e2e` | Playwright smoke-tests |
| `npm run typecheck` | TypeScript-check |

## Connectors synchroniseren

- **Handmatig (admin):** knop "Sync connectors nu" in `/admin`.
- **Cron:** `POST /api/connectors/sync` met `Authorization: Bearer $CRON_SECRET`.
- **Queue:** `npm run worker` verwerkt sync-jobs uit BullMQ (vereist Redis).

## Architectuur in het kort

- **Domeinlaag** (`src/lib/domain`): verdeelmodellen, geschiktheid, drie scores, zoekpunten — puur en getest.
- **Connectors** (`src/lib/connectors`): modulaire `PlatformConnector`-interface met demo-DAK, demo-Rijnmond, JSON-feed en e-mail. Nieuwe platforms voeg je toe in `registry.ts`.
- **Notificaties** (`src/lib/notifications`): push · e-mail · telegram · dashboard met dedup.
- **App** (`src/app`): marketing, auth, beveiligde app-routes, admin, API-routes.

## Veiligheid & privacy

Veilige auth, Zod-validatie, rate limiting, auditlogs, sanitized logging (nooit
wachtwoorden/gevoelige data), gegevensexport en accountverwijdering (AVG),
Nederlandstalige privacyverklaring en voorwaarden.

## Bekende beperkingen (MVP)

Connectors zijn demo/mock met realistische testdata (geen scraping). Reageren
gebeurt handmatig door de gebruiker (by design). WoningKlaar bewaart alleen status
+ verloopdatum. Externe integraties vereisen eigen keys.
