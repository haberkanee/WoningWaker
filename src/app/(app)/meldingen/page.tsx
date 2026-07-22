import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PushToggle } from "@/components/push-toggle";
import { markAllRead, markRead } from "./actions";

export const metadata: Metadata = { title: "Meldingen" };
export const dynamic = "force-dynamic";

export default async function MeldingenPage() {
  const user = await requireUser();
  const meldingen = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meldingen</h1>
          <p className="text-muted-foreground">Nieuwe matches, deadlines en waarschuwingen.</p>
        </div>
        <form action={markAllRead}>
          <Button variant="outline" size="sm" type="submit">Alles gelezen</Button>
        </form>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Pushmeldingen</CardTitle></CardHeader>
        <CardContent>
          <PushToggle vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
        </CardContent>
      </Card>

      {meldingen.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nog geen meldingen.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {meldingen.map((m) => (
            <Card key={m.id} className={m.gelezen ? "" : "border-primary/40 bg-accent/20"}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{m.titel}</p>
                    {!m.gelezen && <Badge variant="default">Nieuw</Badge>}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{m.body}</p>
                  {m.url && (
                    <Link href={m.url} className="mt-1 inline-block text-sm text-primary hover:underline">
                      Bekijken →
                    </Link>
                  )}
                </div>
                {!m.gelezen && (
                  <form action={markRead.bind(null, m.id)}>
                    <Button size="sm" variant="ghost" type="submit">✓</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
