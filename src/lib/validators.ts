import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Vul je naam in").max(80),
  email: z.string().email("Ongeldig e-mailadres"),
  password: z
    .string()
    .min(8, "Minimaal 8 tekens")
    .max(100)
    .regex(/[a-z]/, "Gebruik minimaal één kleine letter")
    .regex(/[A-Z]/, "Gebruik minimaal één hoofdletter")
    .regex(/[0-9]/, "Gebruik minimaal één cijfer"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

const woningTypeEnum = z.enum([
  "APPARTEMENT", "EENGEZINSWONING", "STUDIO", "KAMER",
  "BENEDENWONING", "BOVENWONING", "SENIORENWONING", "ONBEKEND",
]);

export const profileSchema = z.object({
  brutoJaarinkomen: z.coerce.number().int().min(0).max(500_000).nullish(),
  huishoudgrootte: z.coerce.number().int().min(1).max(12).nullish(),
  leeftijd: z.coerce.number().int().min(16).max(120).nullish(),
  huidigeWoonplaats: z.string().max(80).nullish(),
  gewensteRegios: z.array(z.string()).default([]),
  gewensteGemeenten: z.array(z.string()).default([]),
  maxHuurprijs: z.coerce.number().int().min(0).max(3000).nullish(),
  minKamers: z.coerce.number().int().min(1).max(10).nullish(),
  woningtypes: z.array(woningTypeEnum).default([]),
  liftVereist: z.coerce.boolean().default(false),
  beganeGrondVereist: z.coerce.boolean().default(false),
  maxReisafstandKm: z.coerce.number().int().min(0).max(200).nullish(),
  lokaleBinding: z.array(z.string()).default([]),
  voorrangsredenen: z.array(z.string()).default([]),
  studerend: z.coerce.boolean().default(false),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const searchProfileSchema = z.object({
  naam: z.string().min(1, "Geef het zoekprofiel een naam").max(60),
  regios: z.array(z.string()).default([]),
  gemeenten: z.array(z.string()).default([]),
  maxHuurprijs: z.coerce.number().int().min(0).max(3000).nullish(),
  minHuurprijs: z.coerce.number().int().min(0).max(3000).nullish(),
  minKamers: z.coerce.number().int().min(1).max(10).nullish(),
  minOppervlakte: z.coerce.number().int().min(0).max(500).nullish(),
  woningtypes: z.array(woningTypeEnum).default([]),
  verdeelmodellen: z.array(z.string()).default([]),
  alleenGeschikt: z.coerce.boolean().default(false),
  liftVereist: z.coerce.boolean().default(false),
});
export type SearchProfileInput = z.infer<typeof searchProfileSchema>;

export const registrationSchema = z.object({
  platformSlug: z.string().min(1),
  platformNaam: z.string().min(1).max(80),
  regio: z.string().max(80).nullish(),
  status: z.enum(["ACTIEF", "INACTIEF", "ACTIE_NODIG"]).default("ACTIEF"),
  inschrijfdatum: z.coerce.date().nullish(),
  verlengdatum: z.coerce.date().nullish(),
  inschrijfnummer: z.string().max(60).nullish(),
  actieNodig: z.string().max(200).nullish(),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

export const documentSchema = z.object({
  type: z.enum([
    "INKOMENSVERKLARING", "LOONSTROOK", "JAAROPGAVE", "BRP_UITTREKSEL",
    "VERHUURDERSVERKLARING", "IDENTITEITSBEWIJS", "MEDEAANVRAGER",
  ]),
  status: z.enum(["ONTBREEKT", "AANGEVRAAGD", "AANWEZIG", "VERLOPEN"]).default("ONTBREEKT"),
  verloopt: z.coerce.date().nullish(),
  notitie: z.string().max(200).nullish(),
  voorMedeaanvrager: z.coerce.boolean().default(false),
});

export const pointRuleSchema = z.object({
  regio: z.string().min(1),
  reactiesPerMaand: z.coerce.number().int().min(0).max(50).default(1),
  tellendeModellen: z.array(z.string()).default([]),
  actief: z.coerce.boolean().default(true),
});
