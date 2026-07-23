/**
 * Paginakop met sfeerfoto en gradient-overlay (fallback = gradient, dus altijd
 * verzorgd, ook als de foto niet laadt).
 */
export function PageHeader({
  titel,
  ondertitel,
  image,
  children,
}: {
  titel: string;
  ondertitel?: string;
  image: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="bg-hero-fallback relative mb-6 overflow-hidden rounded-2xl bg-cover bg-center p-6 text-white shadow-sm sm:p-8"
      style={{
        backgroundImage: `linear-gradient(110deg, hsl(214 48% 15% / 0.92), hsl(214 45% 20% / 0.68)), url('${image}')`,
      }}
    >
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{titel}</h1>
          {ondertitel && <p className="mt-1 max-w-xl text-sm text-white/80">{ondertitel}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
