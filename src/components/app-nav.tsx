"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Home, User, Search, Target, ClipboardList,
  FileCheck2, Bell, History, Settings, Shield, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/woningen", label: "Woningaanbod", icon: Home },
  { href: "/zoekprofielen", label: "Zoekprofielen", icon: Search },
  { href: "/zoekpunten", label: "ZoekpuntWaker", icon: Target },
  { href: "/inschrijvingen", label: "Inschrijvingen", icon: ClipboardList },
  { href: "/woningklaar", label: "WoningKlaar", icon: FileCheck2 },
  { href: "/reactielogboek", label: "Reactielogboek", icon: History },
  { href: "/meldingen", label: "Meldingen", icon: Bell },
  { href: "/profiel", label: "Profiel", icon: User },
  { href: "/instellingen", label: "Instellingen", icon: Settings },
];

export function AppNav({
  isAdmin,
  plan,
  ongelezen,
  betaaldActief = false,
}: {
  isAdmin: boolean;
  plan: string;
  ongelezen: number;
  betaaldActief?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-4 flex items-center gap-2 px-2 py-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          W
        </span>
        <div>
          <p className="font-bold leading-tight">WoningWaker</p>
          <Badge variant="secondary" className="mt-0.5 text-[10px]">
            {betaaldActief ? planLabel(plan) : "Gratis"}
          </Badge>
        </div>
      </div>

      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.href === "/meldingen" && ongelezen > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {ongelezen}
              </span>
            )}
          </Link>
        );
      })}

      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            "mt-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/admin") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Shield className="h-4 w-4" /> Admin
        </Link>
      )}

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-auto flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <LogOut className="h-4 w-4" /> Uitloggen
      </button>
    </nav>
  );
}

function planLabel(plan: string): string {
  return plan === "WAKER_PLUS" ? "Waker Plus" : plan === "WAKER" ? "Waker" : "Gratis";
}
