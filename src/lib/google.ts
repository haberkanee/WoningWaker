import { APP_URL } from "@/lib/config";

/**
 * Google OAuth + Gmail API via de REST-endpoints (geen extra dependency).
 * Wordt gebruikt voor "Koppel met Gmail": we lezen (alleen-lezen) de
 * woningalerts uit de Gmail van de gebruiker en zetten ze om in echte woningen.
 */
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "openid",
  "email",
];

export function googleConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

export function gmailRedirectUri(): string {
  return `${APP_URL}/api/gmail/callback`;
}

export function gmailAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: gmailRedirectUri(),
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface TokenResp {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
}

export async function exchangeCode(code: string): Promise<TokenResp> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: gmailRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token-uitwisseling mislukt (${res.status})`);
  return (await res.json()) as TokenResp;
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token verversen mislukt (${res.status})`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function gmailEmailAddress(accessToken: string): Promise<string | null> {
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { emailAddress?: string };
  return data.emailAddress ?? null;
}

export async function gmailListMessageIds(accessToken: string, query: string, max = 25): Promise<string[]> {
  const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(max));
  const res = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return [];
  const data = (await res.json()) as { messages?: { id: string }[] };
  return (data.messages ?? []).map((m) => m.id);
}

export interface GmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface Part {
  mimeType?: string;
  filename?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string; size?: number };
  parts?: Part[];
}

function decode(data?: string): string {
  if (!data) return "";
  try {
    return Buffer.from(data, "base64url").toString("utf8");
  } catch {
    return "";
  }
}

function walk(part: Part, acc: { text: string; html: string }) {
  if (part.mimeType === "text/plain") acc.text += decode(part.body?.data);
  else if (part.mimeType === "text/html") acc.html += decode(part.body?.data);
  (part.parts ?? []).forEach((p) => walk(p, acc));
}

export async function gmailGetMessage(accessToken: string, id: string): Promise<GmailMessage | null> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { payload?: Part };
  const payload = data.payload;
  if (!payload) return null;

  const headers = payload.headers ?? [];
  const h = (naam: string) => headers.find((x) => x.name.toLowerCase() === naam)?.value ?? "";
  const acc = { text: "", html: "" };
  walk(payload, acc);

  return {
    from: h("from"),
    to: h("to"),
    subject: h("subject"),
    text: acc.text,
    html: acc.html,
  };
}

/** Zoekopdracht voor woningalerts in Gmail (afzenders van de platforms). */
export const GMAIL_ZOEKQUERY =
  'newer_than:3d (from:woonnetrijnmond.nl OR from:mijndak.nl OR from:woonkeus OR from:woonmatchnhn.nl OR from:hureninhollandrijnland.nl OR subject:(woning OR aanbod OR huurwoning))';
