# WoningWaker — Functioneel & Technisch Ontwerp

> **Positionering:** Woonbot vindt advertenties. WoningWaker begrijpt het volledige sociale-huurproces.

WoningWaker helpt woningzoekenden sociale huurwoningen uit meerdere Nederlandse
regio's en woningplatforms op één plek te vinden, te beoordelen en te bewaken —
zonder de spelregels van de platforms te overtreden.

---

## 1. Functioneel ontwerp

### Kernbeloften

1. **Centraal aanbod** — woningen van meerdere platforms in één overzicht.
2. **Begrip i.p.v. alleen alerts** — verdeelmodellen, geschiktheid en kansen worden uitgelegd.
3. **Procesbewaking** — inschrijvingen, verlengingsdatums, zoekpunten en documenten.
4. **Veilig reageren** — WoningWaker bereidt een reactie voor, de gebruiker klikt zelf op *Definitief reageren*.

### Veiligheidsregel (hard requirement)

WoningWaker reageert **nooit** volledig automatisch. Het systeem mag zoeken,
filteren, controleren, melden, de officiële advertentie openen en een reactie
*voorbereiden*. De definitieve reactie wordt pas ingediend nadat de gebruiker
zelf op **Definitief reageren** klikt. Geen CAPTCHA-omzeiling, geen verborgen
browserautomatisering, geen agressieve scraping. Alleen officiële API's, feeds
en e-mailmeldingen — anders mockconnectors met testdata.

### Hoofdmodules

| # | Module | Kern |
|---|--------|------|
| 1 | Gebruikersprofiel | inkomen, huishouden, leeftijd, wensen, inschrijvingen |
| 2 | Zoekprofielen | meerdere opgeslagen filters per gebruiker |
| 3 | Centraal woningaanbod | woningen van alle connectors, filter/sorteer/favoriet |
| 4 | Verdeelmodellen | herkenning + uitleg (inschrijfduur, loting, direct kans, …) |
| 5 | Geschiktheidscontrole | formele voorwaarden met uitleg + disclaimer |
| 6 | Drie scores | geschiktheid · woonwens · kansindicatie |
| 7 | ZoekpuntWaker | reactiedoelen per regio per maand |
| 8 | Inschrijvingsmanager | platforminschrijvingen + verlengbewaking |
| 9 | WoningKlaar | documentchecklist (status + verloopdatum) |
| 10 | Meldingen | push · e-mail · telegram · dashboard, dedup |
| 11 | Reactieassistent | open & controleer → gebruiker reageert definitief |
| 12 | Reactielogboek | volledige historie per reactie |
| 13 | Dashboard & statistieken | matches, deadlines, voortgang, uitlegbare tips |

### Drie scores

- **Geschiktheidsscore** — voldoet de gebruiker waarschijnlijk aan de formele voorwaarden? (0–100 + status)
- **Woonwensscore** — hoe goed past de woning bij de persoonlijke voorkeuren? (0–100%)
- **Kansindicatie** — hoe realistisch lijkt een uitnodiging? (`ZEER_LAAG`…`HOOG`, `ONBEKEND`)

Elke score toont **altijd** de redenen erachter.

### Geschiktheidsstatussen

`WAARSCHIJNLIJK_GESCHIKT` · `HANDMATIGE_CONTROLE` · `WAARSCHIJNLIJK_NIET_GESCHIKT`

> WoningWaker geeft alleen een indicatie. Het woningplatform of de
> woningcorporatie bepaalt definitief of je in aanmerking komt.

---

## 2. Technische architectuur

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js 14 (App Router, RSC)  +  PWA (manifest + SW)          │
│  UI: React 18 · Tailwind · shadcn-stijl componenten            │
├──────────────────────────────────────────────────────────────┤
│  Server Actions / Route Handlers   Auth.js (credentials)       │
│  Zod-validatie · rate limiting · audit logging                 │
├───────────────┬───────────────────────────┬──────────────────┤
│  Prisma ORM   │  Connector-laag           │  Notificatielaag │
│  PostgreSQL   │  (interface + demo's)     │  push/mail/tg    │
├───────────────┴───────────────────────────┴──────────────────┤
│  Redis + BullMQ  (sync-jobs, notificaties, dedup)              │
│  Stripe (abonnementen) · Resend (mail) · web-push · Telegram   │
└──────────────────────────────────────────────────────────────┘
```

**Connector-interface** — elke platformkoppeling implementeert `PlatformConnector`
(`fetchListings()`), zodat DAK, Woonnet Rijnmond, Woonmatch, Huiswaarts, Woonkeus
later pluggable zijn. MVP levert demo-DAK, demo-Rijnmond, JSON-feed en e-mail.

**Graceful degradation** — Redis/BullMQ, Stripe, Resend, web-push en Telegram zijn
optioneel: ontbreekt de configuratie, dan degradeert de feature netjes (mock /
no-op / dashboard-only) zonder de app te breken. Zo draait de MVP lokaal zonder
externe accounts.

---

## 3. Prisma-datamodel (overzicht)

Kernentiteiten (zie `prisma/schema.prisma` voor volledige definitie):

- **User / Account / Session / VerificationToken** — Auth.js.
- **Profile** — inkomen, huishouden, leeftijd, woonplaats, wensen.
- **SearchProfile** — opgeslagen filters (regio's, prijs, kamers, verdeelmodel…).
- **PlatformRegistration** — inschrijvingen per platform (duur, verlengdatum).
- **Listing** — woning uit een connector (genormaliseerd).
- **ListingMatch** — per gebruiker/woning: 3 scores + geschiktheidsstatus + redenen.
- **Favorite / HiddenListing / ListingNote** — persoonlijke acties.
- **ApplicationLog** — reactielogboek (status, positie, uitnodiging, …).
- **SearchPointRule / SearchPointPeriod** — ZoekpuntWaker config + historie.
- **DocumentChecklistItem** — WoningKlaar (status + verloopdatum).
- **Notification / PushSubscription / NotificationPreference** — meldingen.
- **Subscription** — Stripe-abonnement (plan, status).
- **AuditLog** — beveiligings-/privacy-audittrail.

Enums: `Plan`, `Verdeelmodel`, `GeschiktheidStatus`, `Kansindicatie`,
`ApplicationStatus`, `NotificationChannel`, `WoningType`, `DocumentType`.

---

## 4. Mappenstructuur

```
src/
  app/
    (marketing)   landing, prijzen, privacy, voorwaarden, status
    (auth)        login, registreren
    (app)         dashboard, woningen, profiel, zoekprofielen,
                  zoekpunten, inschrijvingen, woningklaar,
                  reactielogboek, meldingen, instellingen
    admin         adminomgeving
    api           auth, register, connectors/sync, stripe/webhook, push
  components/ui   shadcn-stijl primitives
  lib/
    domain        verdeelmodellen · eligibility · scoring · zoekpunten
    connectors    types · registry · dak · rijnmond · json-feed · email · testdata
    notifications push · email · telegram
    validators    zod-schema's
    prisma.ts auth.ts stripe.ts plans.ts rate-limit.ts audit.ts
prisma/           schema.prisma · seed.ts
public/           manifest · service worker · icons
```

---

## 5. MVP-planning

| Fase | Inhoud | Status |
|------|--------|--------|
| A | Config, Prisma, auth, landing, register/login | ✅ |
| B | Domeinlaag: verdeelmodellen, eligibility, 3 scores, zoekpunten | ✅ |
| C | Connectors (DAK/Rijnmond/JSON/e-mail) + testdata + seed | ✅ |
| D | App-pagina's: dashboard, aanbod, detail, profiel, zoekprofielen | ✅ |
| E | Zoekpunten, inschrijvingen, WoningKlaar, reactielogboek, meldingen | ✅ |
| F | Reactieassistent (open & controleer → definitief reageren) | ✅ |
| G | Abonnementen (plans + Stripe), admin, statuspagina, PWA | ✅ |
| H | Tests (Vitest domein, Playwright smoke), Docker Compose | ✅ |

---

## 6. Bekende beperkingen (MVP)

- Connectors zijn **demo/mock** met realistische testdata; geen echte scraping.
- Reageren gebeurt handmatig door de gebruiker op het echte platform (by design).
- WoningKlaar bewaart alleen status + verloopdatum, geen documentenkluis.
- Stripe/Redis/Resend/web-push/Telegram vereisen eigen keys; zonder keys draait de
  app in gedegradeerde modus (mock/no-op).
- Kansindicatie is heuristisch en expliciet gemarkeerd als indicatie.
