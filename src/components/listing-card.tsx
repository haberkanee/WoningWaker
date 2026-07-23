import Link from "next/link";
import type { Listing, ListingMatch } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GeschiktheidBadge, KansBadge } from "@/components/scores";
import { euro, tijdTot, datum } from "@/lib/utils";
import { verdeelmodelInfo } from "@/lib/domain/verdeelmodellen";
import { toggleFavorite, toggleHidden } from "@/app/(app)/woningen/actions";
import { woningFoto } from "@/lib/images";
import { Heart, EyeOff, ExternalLink } from "lucide-react";

export function ListingCard({
  listing,
  match,
  isFavorite,
}: {
  listing: Listing;
  match: ListingMatch | null;
  isFavorite: boolean;
}) {
  const vm = verdeelmodelInfo(listing.verdeelmodel);
  const favAction = toggleFavorite.bind(null, listing.id);
  const hideAction = toggleHidden.bind(null, listing.id);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md sm:flex">
      {/* Thumbnail (foto met gradient-fallback) */}
      <Link
        href={`/woningen/${listing.id}`}
        className="bg-hero-fallback relative block h-40 shrink-0 bg-cover bg-center sm:h-auto sm:w-52"
        style={{ backgroundImage: `linear-gradient(120deg, hsl(214 48% 18% / 0.15), transparent), url('${woningFoto(listing.woningtype)}')` }}
        aria-hidden
      >
        <span className="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-xs font-semibold text-foreground shadow-sm">
          {euro(listing.huurprijs)}
        </span>
      </Link>
      <CardContent className="flex-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/woningen/${listing.id}`} className="font-semibold hover:underline">
                {listing.titel ?? `${listing.woningtype} ${listing.plaats}`}
              </Link>
              {match && <GeschiktheidBadge status={match.geschiktheidStatus} />}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {listing.plaats}
              {listing.wijk ? ` · ${listing.wijk}` : ""} · {listing.corporatie ?? "—"} ·{" "}
              {listing.platformSlug}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <form action={favAction}>
              <Button type="submit" size="icon" variant={isFavorite ? "default" : "outline"} aria-label="Favoriet">
                <Heart className="h-4 w-4" />
              </Button>
            </form>
            <form action={hideAction}>
              <Button type="submit" size="icon" variant="ghost" aria-label="Verbergen">
                <EyeOff className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold">{euro(listing.huurprijs)}</span>
          {listing.servicekosten > 0 && (
            <span className="text-muted-foreground">+ {euro(listing.servicekosten)} servicekosten</span>
          )}
          {listing.kamers != null && <span className="text-muted-foreground">{listing.kamers} kamers</span>}
          {listing.oppervlakte != null && <span className="text-muted-foreground">{listing.oppervlakte} m²</span>}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{vm.label}</Badge>
          {match && <KansBadge indicatie={match.kansindicatie} />}
          {match && (
            <Badge variant="outline">Woonwens {match.woonwensScore}%</Badge>
          )}
          {listing.sluitDatum && (
            <span className="ml-auto text-xs text-muted-foreground">
              Sluit over {tijdTot(listing.sluitDatum)} · {datum(listing.sluitDatum)}
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/woningen/${listing.id}`}>Open en controleer reactie</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <a href={listing.bronUrl} target="_blank" rel="noopener noreferrer">
              Bron <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
