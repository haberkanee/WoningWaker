# Google OAuth-verificatie voor de Gmail-koppeling

De 1-klik "Koppel met Gmail" gebruikt de scope `gmail.readonly`. Dat is een
**restricted scope**: om hem voor het grote publiek (buiten testgebruikers) te
gebruiken, moet je app door Google's verificatie. Dit document is je stappenplan.

> **Zolang de verificatie loopt** werkt de knop gewoon voor **testgebruikers**
> (OAuth-toestemmingsscherm → Testgebruikers → tot 100 accounts). Voeg jezelf en
> je testers daar toe zodat je alvast kunt gebruiken.

---

## 0. Belangrijk vooraf: eigen domein nodig

Google verifieert alleen **domeinen die je zelf bezit en kunt verifiëren** in
Google Search Console. Een gedeeld `*.vercel.app`-adres kun je meestal **niet**
laten verifiëren. Regel daarom eerst een eigen domein (bijv. `woningwaker.nl`),
koppel dat aan Vercel, en zet `APP_URL` op dat domein.

Dat domein gebruik je overal hieronder in plaats van de vercel.app-URL.

---

## 1. OAuth-toestemmingsscherm volledig invullen

Google Cloud → **APIs en services → OAuth-toestemmingsscherm**:

- **App-naam:** WoningWaker
- **Logo:** upload een logo (vereist voor verificatie).
- **Ondersteunings-e-mail** en **contactgegevens ontwikkelaar.**
- **Startpagina:** `https://<jouwdomein>/`
- **Privacybeleid:** `https://<jouwdomein>/privacy`
- **Servicevoorwaarden:** `https://<jouwdomein>/voorwaarden`
- **Geautoriseerde domeinen:** `<jouwdomein>` (geverifieerd in Search Console).

De app levert deze pagina's al: `/` (landing), `/privacy` (met de vereiste
Google **Limited Use**-verklaring) en `/voorwaarden`.

## 2. Scopes

Voeg alleen toe wat je nodig hebt:
- `openid`, `email`, `profile` (voor inloggen — niet-gevoelig)
- `https://www.googleapis.com/auth/gmail.readonly` (restricted)

Geef bij de scope een duidelijke **justification**, bijvoorbeeld:

> WoningWaker leest uitsluitend de woningaanbod-alertmails van
> woningcorporatie-platforms om ze voor de gebruiker samen te vatten als
> woningen met een geschiktheids- en woonwensscore. We tonen alleen de
> afgeleide woninggegevens; we lezen of bewaren geen overige e-mail en delen
> niets met derden.

## 3. Domeinverificatie

Verifieer `<jouwdomein>` in [Google Search Console](https://search.google.com/search-console).
Zonder geverifieerd domein wijst Google de aanvraag af.

## 4. Demovideo (YouTube)

Maak een korte (ongelijst mag) YouTube-video die laat zien:
1. De OAuth-consent (de toestemmingsschermen met de gevraagde scopes).
2. Wat de app met de data doet (alerts → woningen in het overzicht).
3. De OAuth-client-ID die in de URL/consent te zien is (zodat Google matcht).

## 5. Indienen voor verificatie

OAuth-toestemmingsscherm → **App publiceren** → **Indienen voor verificatie**.
Vul het formulier in (scopes + justification + video-link).

## 6. Beveiligingsbeoordeling (CASA) — voor restricted scopes

Voor `gmail.readonly` vraagt Google doorgaans een onafhankelijke
**CASA-beveiligingsbeoordeling** (jaarlijks, via een Google-geautoriseerde
assessor). Houd rekening met **doorlooptijd (weken)** en **kosten**. Google
mailt je de instructies nadat je hebt ingediend.

De app is hierop voorbereid: versleutelde opslag van tokens, accountverwijdering
en gegevensexport (AVG), auditlogs, en geen logging van gevoelige data.

---

## Samengevat

| Stap | Wie | Status in de app |
|------|-----|------------------|
| Privacybeleid + Limited Use | ✅ klaar | `/privacy` |
| Voorwaarden + homepage | ✅ klaar | `/voorwaarden`, `/` |
| Versleutelde tokens, verwijderen/export | ✅ klaar | ingebouwd |
| Eigen domein + Search Console | jij | — |
| OAuth-scherm invullen + logo | jij | — |
| Demovideo | jij | — |
| Indienen + CASA | jij (Google begeleidt) | — |

Tot de verificatie rond is: gebruik **testgebruikers** — dan werkt alles al
volledig voor die accounts.
