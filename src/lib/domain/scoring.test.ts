import { describe, it, expect } from "vitest";
import { beoordeelGeschiktheid } from "./eligibility";
import { beoordeelWoonwens, beoordeelKans, beoordeelMatch } from "./scoring";
import { berekenZoekpuntStatus, laatsteDagVanMaand } from "./zoekpunten";
import { herkenVerdeelmodel } from "./verdeelmodellen";
import type { ListingInput, ProfielInput } from "./types";

function listing(overrides: Partial<ListingInput> = {}): ListingInput {
  return {
    id: "l1",
    platformSlug: "dak",
    externalId: "x",
    bronUrl: "https://example.test/1",
    plaats: "Dordrecht",
    wijk: null,
    gemeente: "Dordrecht",
    regio: "drechtsteden",
    corporatie: "Woonbron",
    huurprijs: 682,
    servicekosten: 30,
    oppervlakte: 68,
    kamers: 3,
    slaapkamers: 2,
    woningtype: "APPARTEMENT",
    verdeelmodel: "LOTING",
    verdiepingen: 2,
    heeftLift: true,
    beganeGrond: false,
    minLeeftijd: null,
    maxLeeftijd: null,
    maxInkomen: 47000,
    minInkomen: null,
    maxHuishoudgrootte: null,
    minHuishoudgrootte: null,
    lokaleBindingGemeente: null,
    doelgroep: null,
    gepubliceerdOp: new Date(),
    sluitDatum: new Date(Date.now() + 86_400_000),
    titel: "Test",
    omschrijving: null,
    fotoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function profiel(overrides: Partial<ProfielInput> = {}): ProfielInput {
  return {
    brutoJaarinkomen: 38000,
    huishoudgrootte: 2,
    leeftijd: 34,
    huidigeWoonplaats: "Rotterdam",
    gewensteRegios: ["drechtsteden"],
    gewensteGemeenten: ["Dordrecht"],
    maxHuurprijs: 750,
    minKamers: 2,
    woningtypes: ["APPARTEMENT"],
    liftVereist: false,
    beganeGrondVereist: false,
    lokaleBinding: [],
    voorrangsredenen: [],
    studerend: false,
    ...overrides,
  };
}

describe("geschiktheid", () => {
  it("markeert te hoog inkomen als niet geschikt", () => {
    const r = beoordeelGeschiktheid(profiel({ brutoJaarinkomen: 60000 }), listing());
    expect(r.status).toBe("WAARSCHIJNLIJK_NIET_GESCHIKT");
    expect(r.redenen.some((x) => x.ok === "nee")).toBe(true);
  });

  it("is geschikt bij passend inkomen en regio", () => {
    const r = beoordeelGeschiktheid(profiel(), listing());
    expect(r.status).toBe("WAARSCHIJNLIJK_GESCHIKT");
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it("vraagt handmatige controle bij ontbrekend inkomen", () => {
    const r = beoordeelGeschiktheid(profiel({ brutoJaarinkomen: null }), listing());
    expect(r.status).toBe("HANDMATIGE_CONTROLE");
  });

  it("blokkeert buiten leeftijdsgroep (jongerenwoning)", () => {
    const r = beoordeelGeschiktheid(
      profiel({ leeftijd: 40 }),
      listing({ maxLeeftijd: 27, verdeelmodel: "JONGERENWONING" }),
    );
    expect(r.status).toBe("WAARSCHIJNLIJK_NIET_GESCHIKT");
  });
});

describe("woonwens", () => {
  it("scoort hoog bij passende voorkeuren", () => {
    const r = beoordeelWoonwens(profiel(), listing());
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it("scoort lager als huur boven budget ligt", () => {
    const goed = beoordeelWoonwens(profiel(), listing()).score;
    const duur = beoordeelWoonwens(profiel({ maxHuurprijs: 600 }), listing({ huurprijs: 900 })).score;
    expect(duur).toBeLessThan(goed);
  });
});

describe("kansindicatie", () => {
  it("geeft geen valse zekerheid bij loting", () => {
    const r = beoordeelKans(profiel(), listing({ verdeelmodel: "LOTING" }), 90);
    expect(r.redenen.some((x) => /toeval|evenveel kans/.test(x.tekst))).toBe(true);
  });

  it("waardeert lange inschrijfduur bij inschrijfduurmodel", () => {
    const kort = beoordeelKans(profiel(), listing({ verdeelmodel: "INSCHRIJFDUUR" }), 90, { inschrijfjaren: 1 });
    const lang = beoordeelKans(profiel(), listing({ verdeelmodel: "INSCHRIJFDUUR" }), 90, { inschrijfjaren: 10 });
    const rang = { ZEER_LAAG: 0, LAAG: 1, GEMIDDELD: 2, HOOG: 3, ONBEKEND: 2 };
    expect(rang[lang.indicatie]).toBeGreaterThanOrEqual(rang[kort.indicatie]);
  });
});

describe("match", () => {
  it("levert alle drie de scores", () => {
    const r = beoordeelMatch(profiel(), listing());
    expect(r.geschiktheid).toBeDefined();
    expect(r.woonwens).toBeDefined();
    expect(r.kans).toBeDefined();
  });
});

describe("zoekpunten", () => {
  it("berekent resterende reacties en samenvatting", () => {
    const s = berekenZoekpuntStatus({ regio: "drechtsteden", jaar: 2026, maand: 7, doel: 4, behaald: 3 });
    expect(s.resterend).toBe(1);
    expect(s.voltooid).toBe(false);
    expect(s.samenvatting).toMatch(/één passende reactie/);
  });

  it("markeert voltooid doel", () => {
    const s = berekenZoekpuntStatus({ regio: "x", jaar: 2026, maand: 7, doel: 2, behaald: 2 });
    expect(s.voltooid).toBe(true);
  });

  it("laatste dag van juli is 31", () => {
    expect(laatsteDagVanMaand(2026, 7).getDate()).toBe(31);
  });
});

describe("verdeelmodel herkenning", () => {
  it("herkent loting en direct kans", () => {
    expect(herkenVerdeelmodel("Toewijzing via loting")).toBe("LOTING");
    expect(herkenVerdeelmodel("Direct te huur, wie het eerst reageert")).toBe("DIRECT_KANS");
    expect(herkenVerdeelmodel("op basis van inschrijfduur")).toBe("INSCHRIJFDUUR");
  });
});
