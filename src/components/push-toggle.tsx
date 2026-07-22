"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushToggle({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [status, setStatus] = useState<"onbekend" | "aan" | "uit" | "geenondersteuning">("onbekend");
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("geenondersteuning");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "aan" : "uit"))
      .catch(() => setStatus("uit"));
  }, []);

  async function inschakelen() {
    if (!vapidPublicKey) return;
    setBezig(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setBezig(false); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setStatus("aan");
    } catch {
      /* stil */
    }
    setBezig(false);
  }

  async function uitschakelen() {
    setBezig(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("uit");
    } catch {
      /* stil */
    }
    setBezig(false);
  }

  if (status === "geenondersteuning")
    return <p className="text-sm text-muted-foreground">Je browser ondersteunt geen pushmeldingen.</p>;
  if (!vapidPublicKey)
    return <p className="text-sm text-muted-foreground">Pushmeldingen zijn nog niet geconfigureerd op deze server.</p>;

  return status === "aan" ? (
    <Button variant="outline" size="sm" onClick={uitschakelen} disabled={bezig}>
      {bezig ? "Bezig…" : "Pushmeldingen uitschakelen"}
    </Button>
  ) : (
    <Button size="sm" onClick={inschakelen} disabled={bezig}>
      {bezig ? "Bezig…" : "Pushmeldingen inschakelen"}
    </Button>
  );
}
