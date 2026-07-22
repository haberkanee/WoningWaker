import type { NotifyInput } from "./index";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/**
 * Verstuurt een Telegram-bericht via de Bot API (no-op zonder BOT_TOKEN).
 * Alleen beschikbaar voor Waker Plus.
 */
export async function sendTelegram(chatId: string, input: NotifyInput): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const link = input.url ? `${APP_URL}${input.url}` : APP_URL;
  const text = `*${input.titel}*\n${input.body}\n\n[Bekijk in WoningWaker](${link})`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      }),
    });
  } catch {
    // best-effort
  }
}
