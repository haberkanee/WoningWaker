import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function euro(bedrag: number | null | undefined): string {
  if (bedrag == null) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(bedrag);
}

export function datum(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

const MAANDEN = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

export function maandNaam(maand: number): string {
  return MAANDEN[(maand - 1 + 12) % 12] ?? "";
}

/** Menselijke "sluit over X" tekst. */
export function tijdTot(d: Date | string | null | undefined): string {
  if (!d) return "onbekend";
  const ms = new Date(d).getTime() - Date.now();
  if (ms <= 0) return "gesloten";
  const uren = Math.floor(ms / 3_600_000);
  if (uren < 1) return `${Math.floor(ms / 60_000)} min`;
  if (uren < 48) return `${uren} uur`;
  return `${Math.floor(uren / 24)} dagen`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
