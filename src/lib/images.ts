import type { WoningType } from "@prisma/client";

/**
 * Beeldmateriaal. We hotlinken vrije foto's (Unsplash) en leggen er altijd een
 * gradient onder als fallback, zodat een header er ook zonder foto verzorgd
 * uitziet. Connectors kunnen later een echte `fotoUrl` per woning aanleveren;
 * tot die tijd kiezen we een passende sfeerfoto op basis van het woningtype.
 */

const U = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const HERO_IMAGE = U("1560518883-ce09059eeffa"); // moderne woonstraat
export const HEADER_IMAGES = {
  dashboard: U("1568605114967-8130f3a36994", 1400), // huizenrij
  woningen: U("1493809842364-78817add7ffb", 1400), // appartementen
  aanbod: U("1460317442991-0ec209397118", 1400), // straat met huizen
  proces: U("1522708323590-d24dbb6b0267", 1400), // interieur woonkamer
};

const TYPE_IMAGES: Record<WoningType, string> = {
  APPARTEMENT: U("1522708323590-d24dbb6b0267", 800),
  BOVENWONING: U("1502672260266-1c1ef2d93688", 800),
  BENEDENWONING: U("1512917774080-9991f1c4c750", 800),
  EENGEZINSWONING: U("1568605114967-8130f3a36994", 800),
  STUDIO: U("1554995207-c18c203602cb", 800),
  KAMER: U("1493809842364-78817add7ffb", 800),
  SENIORENWONING: U("1600585154340-be6161a56a0c", 800),
  ONBEKEND: U("1560448204-e02f11c3d0e2", 800),
};

export function woningFoto(type: WoningType): string {
  return TYPE_IMAGES[type] ?? TYPE_IMAGES.ONBEKEND;
}
