import { describe, it, expect } from "vitest";
import { parseAlertEmail, platformVoorEmail, tokenUitAdres, vanPostmark, type InboundEmail } from "./inbound";

const rijnmondMail: InboundEmail = {
  from: "geenreactie@woonnetrijnmond.nl",
  to: "abc123+usertoken@inbound.postmarkapp.com",
  subject: "Nieuw in het aanbod: 3-kamerappartement in Rotterdam",
  text: [
    "Er is een nieuwe woning die past bij je zoekopdracht.",
    "Adres: Schiedamseweg, Rotterdam (Delfshaven)",
    "Huurprijs: € 689,50 per maand",
    "Oppervlakte: 64 m²",
    "Aantal kamers: 3",
    "Type: appartement",
    "Toewijzing via loting",
    "Reageren tot 12 augustus 2026",
    "Bekijk de woning: https://www.woonnetrijnmond.nl/woningaanbod/details/12345",
  ].join("\n"),
  html: "",
  mailboxHash: "usertoken",
};

describe("inbound e-mailparser", () => {
  it("herkent het platform en de regio uit de afzender", () => {
    const p = platformVoorEmail(rijnmondMail);
    expect(p.slug).toBe("rijnmond");
    expect(p.regio).toBe("rotterdam");
  });

  it("parseert een echte alert tot een woning met de echte link", () => {
    const w = parseAlertEmail(rijnmondMail);
    expect(w).not.toBeNull();
    expect(w!.bronUrl).toBe("https://www.woonnetrijnmond.nl/woningaanbod/details/12345");
    expect(w!.externalId).toBe("12345");
    expect(w!.plaats).toBe("Rotterdam");
    expect(w!.huurprijs).toBe(690); // 689,50 afgerond
    expect(w!.kamers).toBe(3);
    expect(w!.oppervlakte).toBe(64);
    expect(w!.woningtype).toBe("APPARTEMENT");
    expect(w!.verdeelmodel).toBe("LOTING");
    expect(w!.regio).toBe("rotterdam");
    expect(w!.sluitDatum?.getFullYear()).toBe(2026);
  });

  it("leest de woning ook uit HTML zonder tekstversie", () => {
    const htmlMail: InboundEmail = {
      from: "no-reply@mijndak.nl",
      to: "abc+t@inbound.postmarkapp.com",
      subject: "Nieuwe woning Dordrecht",
      text: "",
      html: `<html><body><h1>Eengezinswoning te Dordrecht</h1>
        <img src="https://cdn.mijndak.nl/foto/9.jpg" width="600" />
        <p>Huurprijs: € 745</p><p>Kamers: 4</p>
        <a href="https://woonkeus.mijndak.nl/aanbod/9988">Bekijk</a></body></html>`,
      mailboxHash: "t",
    };
    const w = parseAlertEmail(htmlMail);
    expect(w).not.toBeNull();
    expect(w!.bronUrl).toBe("https://woonkeus.mijndak.nl/aanbod/9988");
    expect(w!.fotoUrl).toBe("https://cdn.mijndak.nl/foto/9.jpg");
    expect(w!.huurprijs).toBe(745);
    expect(w!.plaats).toBe("Dordrecht");
  });

  it("geeft null zonder advertentielink", () => {
    const w = parseAlertEmail({ ...rijnmondMail, text: "Geen link hier", html: "" });
    expect(w).toBeNull();
  });

  it("haalt het token uit een plus-adres", () => {
    expect(tokenUitAdres("abc123+usertoken@inbound.postmarkapp.com")).toBe("usertoken");
  });

  it("normaliseert een Postmark-payload", () => {
    const e = vanPostmark({
      FromFull: { Email: "x@woonnetrijnmond.nl" },
      ToFull: [{ Email: "abc+tok@inbound.postmarkapp.com" }],
      Subject: "Test",
      TextBody: "body",
      MailboxHash: "tok",
    });
    expect(e.from).toContain("woonnetrijnmond");
    expect(e.mailboxHash).toBe("tok");
  });
});
