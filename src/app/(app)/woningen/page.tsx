import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureUserData } from "@/lib/matching";
import { ListingCard } from "@/components/listing-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { REGIOS } from "@/lib/regios";
import { PageHeader } from "@/components/page-header";
import { HEADER_IMAGES } from "@/lib/images";
import type { GeschiktheidStatus, Verdeelmodel } from "@prisma/client";

export const metadata: Metadata = { title: "Woningaanbod" };
export const dynamic = "force-dynamic";

type SP = {
  regio?: string;
  model?: string;
  sort?: string;
  status?: string;
  favoriet?: string;
  maxPrijs?: string;
};

export default async function WoningenPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  await ensureUserData(user.id);

  const [matchesRaw, favorites, hidden] = await Promise.all([
    prisma.listingMatch.findMany({
      where: { userId: user.id },
      include: { listing: true },
    }),
    prisma.favorite.findMany({ where: { userId: user.id }, select: { listingId: true } }),
    prisma.hiddenListing.findMany({ where: { userId: user.id }, select: { listingId: true } }),
  ]);

  const favSet = new Set(favorites.map((f) => f.listingId));
  const hiddenSet = new Set(hidden.map((h) => h.listingId));

  let items = matchesRaw.filter((m) => !hiddenSet.has(m.listingId));

  // Filters
  if (searchParams.regio) items = items.filter((m) => m.listing.regio === searchParams.regio);
  if (searchParams.model) items = items.filter((m) => m.listing.verdeelmodel === (searchParams.model as Verdeelmodel));
  if (searchParams.status) items = items.filter((m) => m.geschiktheidStatus === (searchParams.status as GeschiktheidStatus));
  if (searchParams.favoriet === "1") items = items.filter((m) => favSet.has(m.listingId));
  if (searchParams.maxPrijs) {
    const max = Number(searchParams.maxPrijs);
    if (!Number.isNaN(max)) items = items.filter((m) => m.listing.huurprijs <= max);
  }

  // Sortering
  const sort = searchParams.sort ?? "woonwens";
  items.sort((a, b) => {
    switch (sort) {
      case "prijs": return a.listing.huurprijs - b.listing.huurprijs;
      case "sluit":
        return (a.listing.sluitDatum?.getTime() ?? Infinity) - (b.listing.sluitDatum?.getTime() ?? Infinity);
      case "nieuw":
        return b.listing.gepubliceerdOp.getTime() - a.listing.gepubliceerdOp.getTime();
      case "geschikt": return b.geschiktheidScore - a.geschiktheidScore;
      default: return b.woonwensScore - a.woonwensScore;
    }
  });

  const modellen: [Verdeelmodel, string][] = [
    ["LOTING", "Loting"],
    ["INSCHRIJFDUUR", "Inschrijfduur"],
    ["DIRECT_KANS", "Direct Kans"],
    ["JONGERENWONING", "Jongerenwoning"],
    ["SENIORENWONING", "Seniorenwoning"],
    ["LOKALE_VOORRANG", "Lokale voorrang"],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        titel="Woningaanbod"
        ondertitel={`${items.length} woningen op basis van jouw profiel`}
        image={HEADER_IMAGES.woningen}
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <FilterSelect label="Regio" name="regio" value={searchParams.regio} options={REGIOS.map((r) => [r.slug, r.naam])} />
            <FilterSelect label="Verdeelmodel" name="model" value={searchParams.model} options={modellen} />
            <FilterSelect
              label="Geschiktheid"
              name="status"
              value={searchParams.status}
              options={[
                ["WAARSCHIJNLIJK_GESCHIKT", "Geschikt"],
                ["HANDMATIGE_CONTROLE", "Controle nodig"],
                ["WAARSCHIJNLIJK_NIET_GESCHIKT", "Niet geschikt"],
              ]}
            />
            <FilterSelect
              label="Sorteer op"
              name="sort"
              value={sort}
              options={[
                ["woonwens", "Woonwensscore"],
                ["geschikt", "Geschiktheid"],
                ["prijs", "Prijs (laag→hoog)"],
                ["sluit", "Sluit binnenkort"],
                ["nieuw", "Nieuwste"],
              ]}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="favoriet" value="1" defaultChecked={searchParams.favoriet === "1"} />
              Alleen favorieten
            </label>
            <button className="ml-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Filter
            </button>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Geen woningen gevonden met deze filters.{" "}
            <Link href="/woningen" className="text-primary underline">Reset filters</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((m) => (
            <ListingCard
              key={m.id}
              listing={m.listing}
              match={m}
              isFavorite={favSet.has(m.listingId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value?: string;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-9 rounded-md border border-input bg-card px-2 text-sm text-foreground"
      >
        <option value="">Alle</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}
