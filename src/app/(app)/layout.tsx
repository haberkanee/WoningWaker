import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { BETAALD_ACTIEF } from "@/lib/plans";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const ongelezen = await prisma.notification.count({
    where: { userId: user.id, gelezen: false },
  });

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-card md:block">
        <AppNav isAdmin={user.role === "ADMIN"} plan={user.plan} ongelezen={ongelezen} betaaldActief={BETAALD_ACTIEF} />
      </aside>
      <div className="flex-1">
        {/* Mobiele topbalk */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <span className="font-bold">WoningWaker</span>
        </header>
        <main className="container max-w-6xl py-6">{children}</main>
        {/* Mobiele onderbalk */}
        <div className="sticky bottom-0 z-30 border-t bg-card md:hidden">
          <div className="grid grid-cols-5 text-xs">
            {[
              { href: "/dashboard", label: "Home" },
              { href: "/woningen", label: "Aanbod" },
              { href: "/zoekpunten", label: "Punten" },
              { href: "/meldingen", label: "Meldingen" },
              { href: "/profiel", label: "Profiel" },
            ].map((i) => (
              <a key={i.href} href={i.href} className="py-2 text-center text-muted-foreground">
                {i.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
