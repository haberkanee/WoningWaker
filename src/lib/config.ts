/**
 * App-brede schakelaars.
 */

// Demodata (voorbeeldwoningen) standaard UIT. Zet DEMO_DATA=true om de
// demo-connectors weer te laden (handig om de app te bekijken zonder echte bron).
export const DEMO_DATA = process.env.DEMO_DATA === "true";

// Basis inbound-adres van je e-mailprovider (bv. Postmark), zoals
// "abc1234@inbound.postmarkapp.com". Per gebruiker wordt +token ingevoegd.
export const INBOUND_BASE_ADDRESS = process.env.INBOUND_BASE_ADDRESS ?? "";

/** Persoonlijk doorstuuradres voor een gebruiker (plus-addressing met token). */
export function inboundAddressVoor(token: string | null | undefined): string | null {
  if (!token || !INBOUND_BASE_ADDRESS.includes("@")) return null;
  const [local, domain] = INBOUND_BASE_ADDRESS.split("@");
  return `${local}+${token}@${domain}`;
}

export const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/** De persoonlijke webhook-URL voor de Gmail-methode (token als sleutel). */
export function inboundWebhookUrl(token: string): string {
  return `${APP_URL}/api/inbound/email?token=${token}`;
}

/** Kant-en-klaar Google Apps Script dat gelabelde Gmail-alerts doorstuurt. */
export function gmailAppsScript(token: string): string {
  const url = inboundWebhookUrl(token);
  return `// WoningWaker — stuurt gelabelde woningalerts door naar je account.
// Plakken op script.google.com (Nieuw project), opslaan en een trigger zetten.
const WEBHOOK_URL = "${url}";
const LABEL = "WoningWaker";        // label dat je met een Gmail-filter toekent
const DONE  = "WoningWaker-verwerkt";

function woningwakerSync() {
  const done = GmailApp.getUserLabelByName(DONE) || GmailApp.createLabel(DONE);
  const threads = GmailApp.search("label:" + LABEL + " -label:" + DONE, 0, 25);
  threads.forEach(function (t) {
    t.getMessages().forEach(function (m) {
      const payload = {
        from: m.getFrom(), to: m.getTo(), subject: m.getSubject(),
        text: m.getPlainBody(), html: m.getBody()
      };
      UrlFetchApp.fetch(WEBHOOK_URL, {
        method: "post", contentType: "application/json",
        payload: JSON.stringify(payload), muteHttpExceptions: true
      });
    });
    t.addLabel(done);
  });
}`;
}
