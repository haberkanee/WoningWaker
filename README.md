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

## Snel starten (lokaal)

```bash
# 1. Dependencies
npm install

# 2. Infra (Postgres + Redis)
docker compose up -d db redis

# 3. Environment
cp .env.example .env
#   Vul minimaal DATABASE_URL en AUTH_SECRET in.
#   AUTH_SECRET genereren: openssl rand -base64 32

# 4. Database + demo-data
npm run db:push        # schema naar database
npm run db:seed        # demo-gebruiker + testwoningen

# 5. Start
npm run dev            # http://localhost:3000
# (optioneel) achtergrondworker voor sync & verloopbewaking:
npm run worker
```

### Demo-accounts (na seed)

| Rol   | E-mail                  | Wachtwoord |
|-------|-------------------------|------------|
| Admin | `admin@woningwaker.nl`  | `Demo1234` |
| User  | `demo@woningwaker.nl`   | `Demo1234` |

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
