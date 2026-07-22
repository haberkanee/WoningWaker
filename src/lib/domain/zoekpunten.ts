import { maandNaam } from "@/lib/utils";

/**
 * ZoekpuntWaker — houdt per regio bij hoeveel passende reacties deze maand nodig
 * zijn, hoeveel er al zijn geplaatst, en wat de deadline is. Regels zijn
 * configureerbaar per regio (reactiesPerMaand + tellende verdeelmodellen).
 */
export interface ZoekpuntStatus {
  regio: string;
  jaar: number;
  maand: number;
  maandLabel: string;
  doel: number;
  behaald: number;
  resterend: number;
  deadline: Date;
  dagenTot: number;
  voltooid: boolean;
  samenvatting: string;
}

export function laatsteDagVanMaand(jaar: number, maand: number): Date {
  // maand is 1-12; Date maand-index 0-11; dag 0 van volgende maand = laatste dag
  return new Date(jaar, maand, 0, 23, 59, 59, 999);
}

export function berekenZoekpuntStatus(input: {
  regio: string;
  jaar: number;
  maand: number;
  doel: number;
  behaald: number;
  deadline?: Date | null;
}): ZoekpuntStatus {
  const deadline = input.deadline ?? laatsteDagVanMaand(input.jaar, input.maand);
  const resterend = Math.max(0, input.doel - input.behaald);
  const voltooid = resterend === 0;
  const msTot = deadline.getTime() - Date.now();
  const dagenTot = Math.max(0, Math.ceil(msTot / 86_400_000));
  const maandLabel = maandNaam(input.maand);

  let samenvatting: string;
  if (voltooid) {
    samenvatting = `Doel behaald: ${input.behaald} van ${input.doel} reacties voltooid.`;
  } else if (resterend === 1) {
    samenvatting = `Nog één passende reactie nodig vóór ${deadline.getDate()} ${maandLabel}.`;
  } else {
    samenvatting = `Nog ${resterend} passende reacties nodig vóór ${deadline.getDate()} ${maandLabel}.`;
  }

  return {
    regio: input.regio,
    jaar: input.jaar,
    maand: input.maand,
    maandLabel,
    doel: input.doel,
    behaald: input.behaald,
    resterend,
    deadline,
    dagenTot,
    voltooid,
    samenvatting,
  };
}

export function huidigeJaarMaand(): { jaar: number; maand: number } {
  const now = new Date();
  return { jaar: now.getFullYear(), maand: now.getMonth() + 1 };
}
