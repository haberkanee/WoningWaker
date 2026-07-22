import type {
  GeschiktheidStatus,
  Kansindicatie,
  Listing,
  Profile,
} from "@prisma/client";

/** Een enkele uitlegregel achter een score. */
export interface Reden {
  ok: "ja" | "nee" | "onbekend";
  tekst: string;
}

export interface GeschiktheidResultaat {
  score: number; // 0-100
  status: GeschiktheidStatus;
  redenen: Reden[];
}

export interface WoonwensResultaat {
  score: number; // 0-100
  redenen: Reden[];
}

export interface KansResultaat {
  indicatie: Kansindicatie;
  redenen: Reden[];
}

export interface MatchResultaat {
  geschiktheid: GeschiktheidResultaat;
  woonwens: WoonwensResultaat;
  kans: KansResultaat;
}

/** Minimale profielvorm die de domeinlaag nodig heeft. */
export type ProfielInput = Pick<
  Profile,
  | "brutoJaarinkomen"
  | "huishoudgrootte"
  | "leeftijd"
  | "huidigeWoonplaats"
  | "gewensteRegios"
  | "gewensteGemeenten"
  | "maxHuurprijs"
  | "minKamers"
  | "woningtypes"
  | "liftVereist"
  | "beganeGrondVereist"
  | "lokaleBinding"
  | "voorrangsredenen"
  | "studerend"
>;

export type ListingInput = Listing;

export const DISCLAIMER =
  "WoningWaker geeft alleen een indicatie. Het woningplatform of de woningcorporatie bepaalt definitief of je in aanmerking komt.";
