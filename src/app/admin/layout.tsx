import Link from "next/link";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/admin" className="font-bold">WoningWaker · Admin</Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Terug naar app
          </Link>
        </div>
      </header>
      <main className="container max-w-5xl py-6">{children}</main>
    </div>
  );
}
