import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BETAALD_ACTIEF } from "@/lib/plans";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            W
          </span>
          WoningWaker
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/#functies" className="text-muted-foreground hover:text-foreground">Functies</Link>
          {BETAALD_ACTIEF && (
            <Link href="/prijzen" className="text-muted-foreground hover:text-foreground">Prijzen</Link>
          )}
          <Link href="/status" className="text-muted-foreground hover:text-foreground">Status</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Inloggen</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/registreren">Gratis starten</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} WoningWaker. Geen woningplatform, maar je assistent.</p>
        <nav className="flex flex-wrap gap-4">
          {BETAALD_ACTIEF && <Link href="/prijzen" className="hover:text-foreground">Prijzen</Link>}
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/voorwaarden" className="hover:text-foreground">Voorwaarden</Link>
          <Link href="/status" className="hover:text-foreground">Platformstatus</Link>
        </nav>
      </div>
    </footer>
  );
}
