/** Ondersteunde regio's (MVP). Uitbreidbaar naarmate connectors worden toegevoegd. */
export interface Regio {
  slug: string;
  naam: string;
  platform: string;
}

export const REGIOS: Regio[] = [
  { slug: "rotterdam", naam: "Rotterdam-Rijnmond", platform: "Woonnet Rijnmond" },
  { slug: "drechtsteden", naam: "Drechtsteden (Dordrecht e.o.)", platform: "Mijn DAK" },
  { slug: "noord-holland-noord", naam: "Noord-Holland Noord (Alkmaar e.o.)", platform: "Woonmatch" },
];

export function regioNaam(slug: string | null | undefined): string {
  if (!slug) return "—";
  return REGIOS.find((r) => r.slug === slug)?.naam ?? slug;
}
