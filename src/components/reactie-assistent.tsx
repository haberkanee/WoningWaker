"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ExternalLink, AlertTriangle } from "lucide-react";

interface Props {
  listingId: string;
  bronUrl: string;
  nogBeschikbaar: boolean;
  ontbrekendeInfo: string[];
  alGereageerd: boolean;
  bevestigAction: (listingId: string) => Promise<{ ok?: boolean; error?: string }>;
}

type Stap = 0 | 1 | 2 | 3;

export function ReactieAssistent({
  listingId,
  bronUrl,
  nogBeschikbaar,
  ontbrekendeInfo,
  alGereageerd,
  bevestigAction,
}: Props) {
  const [gestart, setGestart] = useState(false);
  const [stap, setStap] = useState<Stap>(0);
  const [geopend, setGeopend] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [klaar, setKlaar] = useState(alGereageerd);
  const [fout, setFout] = useState<string | null>(null);

  if (klaar) {
    return (
      <Card className="border-success/40 bg-success/5">
        <CardContent className="flex items-center gap-3 py-6">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <div>
            <p className="font-semibold">Reactie geregistreerd</p>
            <p className="text-sm text-muted-foreground">
              We hebben deze reactie in je reactielogboek gezet. Succes!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!gestart) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reactieassistent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            WoningWaker bereidt je reactie voor en controleert alles. Je reageert
            altijd zelf op het officiële platform — wij dienen nooit automatisch in.
          </p>
          <Button onClick={() => setGestart(true)} disabled={!nogBeschikbaar}>
            Open en controleer reactie
          </Button>
          {!nogBeschikbaar && (
            <p className="text-sm text-destructive">Deze woning is niet meer beschikbaar.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reactieassistent</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StapRegel done={stap > 0} active={stap === 0} nr={1} titel="Beschikbaarheid gecontroleerd">
          {nogBeschikbaar ? (
            <Badge variant="success">Nog beschikbaar</Badge>
          ) : (
            <Badge variant="destructive">Niet meer beschikbaar</Badge>
          )}
          {stap === 0 && (
            <Button size="sm" className="mt-2" onClick={() => setStap(1)}>Volgende</Button>
          )}
        </StapRegel>

        <StapRegel done={stap > 1} active={stap === 1} nr={2} titel="Ontbrekende informatie">
          {ontbrekendeInfo.length === 0 ? (
            <p className="text-sm text-muted-foreground">Alles compleet — niets ontbreekt.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {ontbrekendeInfo.map((t) => (
                <li key={t} className="flex items-center gap-2 text-warning-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" /> {t}
                </li>
              ))}
            </ul>
          )}
          {stap === 1 && (
            <Button size="sm" className="mt-2" onClick={() => setStap(2)}>Volgende</Button>
          )}
        </StapRegel>

        <StapRegel done={stap > 2} active={stap === 2} nr={3} titel="Open de officiële advertentie & log zelf in">
          {stap >= 2 && (
            <div className="space-y-2">
              <Button asChild size="sm" variant="secondary" onClick={() => setGeopend(true)}>
                <a href={bronUrl} target="_blank" rel="noopener noreferrer">
                  Open advertentie <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">
                Log in op het platform en controleer de gegevens. WoningWaker vult
                niets automatisch in.
              </p>
              {stap === 2 && (
                <Button size="sm" disabled={!geopend} onClick={() => setStap(3)}>
                  Ik heb de advertentie geopend
                </Button>
              )}
            </div>
          )}
        </StapRegel>

        <StapRegel done={false} active={stap === 3} nr={4} titel="Definitief reageren">
          {stap === 3 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Heb je op het platform definitief gereageerd? Bevestig dan hier, dan
                zetten we het in je reactielogboek en tellen we het mee voor je zoekpunten.
              </p>
              {fout && <p className="text-sm text-destructive">{fout}</p>}
              <Button
                disabled={bezig}
                onClick={async () => {
                  setBezig(true);
                  setFout(null);
                  const res = await bevestigAction(listingId);
                  setBezig(false);
                  if (res.error) setFout(res.error);
                  else setKlaar(true);
                }}
              >
                {bezig ? "Bezig…" : "Definitief reageren"}
              </Button>
            </div>
          )}
        </StapRegel>
      </CardContent>
    </Card>
  );
}

function StapRegel({
  nr,
  titel,
  done,
  active,
  children,
}: {
  nr: number;
  titel: string;
  done: boolean;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5">
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <Circle className={active ? "h-5 w-5 text-primary" : "h-5 w-5 text-muted-foreground"} />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {nr}. {titel}
        </p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}
