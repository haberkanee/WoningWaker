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
