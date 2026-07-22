import { Resend } from "resend";
import type { NotifyInput } from "./index";

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

const FROM = process.env.EMAIL_FROM ?? "WoningWaker <meldingen@woningwaker.nl>";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/** Verstuurt een notificatie-e-mail via Resend (no-op zonder API-key). */
export async function sendEmailNotification(to: string, input: NotifyInput): Promise<void> {
  const client = getResend();
  if (!client) return;
  const link = input.url ? `${APP_URL}${input.url}` : APP_URL;
  try {
    await client.emails.send({
      from: FROM,
      to,
      subject: input.titel,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px">
          <h2 style="margin:0 0 8px">${escapeHtml(input.titel)}</h2>
          <p style="white-space:pre-line;color:#334">${escapeHtml(input.body)}</p>
          <p><a href="${link}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Bekijk in WoningWaker</a></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
          <p style="font-size:12px;color:#889">Je ontvangt deze mail omdat je meldingen hebt ingeschakeld in WoningWaker.</p>
        </div>`,
    });
  } catch {
    // best-effort
  }
}

/** Algemene transactionele mail (verificatie, welkom, etc.). */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const client = getResend();
  if (!client) return false;
  try {
    await client.emails.send({ from: FROM, to, subject, html });
    return true;
  } catch {
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
