import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-accent/30 p-4">
      <Link href="/" className="mb-6 flex items-center gap-2 text-xl font-bold">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          W
        </span>
        WoningWaker
      </Link>
      {children}
    </div>
  );
}
