export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-bold">Je bent offline</h1>
      <p className="max-w-sm text-muted-foreground">
        WoningWaker heeft geen internetverbinding. Zodra je weer online bent,
        laden we het laatste woningaanbod opnieuw.
      </p>
    </div>
  );
}
