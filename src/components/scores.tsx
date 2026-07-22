import type { GeschiktheidStatus, Kansindicatie } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { GESCHIKTHEID_LABEL, KANS_LABEL } from "@/lib/domain/scoring";
import type { Reden } from "@/lib/domain/types";

export function GeschiktheidBadge({ status }: { status: GeschiktheidStatus }) {
  const variant =
    status === "WAARSCHIJNLIJK_GESCHIKT"
      ? "success"
      : status === "HANDMATIGE_CONTROLE"
        ? "warning"
        : "destructive";
  return <Badge variant={variant}>{GESCHIKTHEID_LABEL[status]}</Badge>;
}

const KANS_VARIANT: Record<Kansindicatie, "success" | "warning" | "destructive" | "secondary"> = {
  HOOG: "success",
  GEMIDDELD: "warning",
  LAAG: "destructive",
  ZEER_LAAG: "destructive",
  ONBEKEND: "secondary",
};

export function KansBadge({ indicatie }: { indicatie: Kansindicatie }) {
  return <Badge variant={KANS_VARIANT[indicatie]}>Kans: {KANS_LABEL[indicatie]}</Badge>;
}

export function ScoreBar({
  label,
  score,
  kleur,
}: {
  label: string;
  score: number;
  kleur?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{score}%</span>
      </div>
      <Progress value={score} indicatorClassName={kleur} />
    </div>
  );
}

export function RedenenLijst({ redenen, titel }: { redenen: Reden[]; titel?: string }) {
  return (
    <div>
      {titel && <p className="mb-2 text-sm font-medium">{titel}</p>}
      <ul className="space-y-1.5">
        {redenen.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span
              className={cn(
                "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                r.ok === "ja" && "bg-success/15 text-success",
                r.ok === "nee" && "bg-destructive/15 text-destructive",
                r.ok === "onbekend" && "bg-warning/20 text-warning-foreground",
              )}
              aria-hidden
            >
              {r.ok === "ja" ? "✓" : r.ok === "nee" ? "✕" : "?"}
            </span>
            <span className="text-muted-foreground">{r.tekst}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
