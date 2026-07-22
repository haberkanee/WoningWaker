"use client";

import { useTransition } from "react";
import type { NotificationChannel, NotificationType, Plan } from "@prisma/client";
import { toggleNotificationPref } from "./actions";
import { planConfig } from "@/lib/plans";

const TYPES: [NotificationType, string][] = [
  ["NIEUWE_MATCH", "Nieuwe matches"],
  ["BIJNA_SLUITEN", "Sluit binnenkort"],
  ["ZOEKPUNTEN", "Zoekpunten"],
  ["INSCHRIJVING_VERLOOPT", "Inschrijving verloopt"],
  ["DOCUMENT_VERLOOPT", "Document verloopt"],
];

const CHANNELS: [NotificationChannel, string][] = [
  ["DASHBOARD", "Dashboard"],
  ["EMAIL", "E-mail"],
  ["PUSH", "Push"],
  ["TELEGRAM", "Telegram"],
];

export function NotificatieVoorkeuren({
  plan,
  prefs,
}: {
  plan: Plan;
  prefs: { type: NotificationType; channel: NotificationChannel; enabled: boolean }[];
}) {
  const [pending, startTransition] = useTransition();
  const cfg = planConfig(plan);

  const isEnabled = (type: NotificationType, channel: NotificationChannel) => {
    const pref = prefs.find((p) => p.type === type && p.channel === channel);
    return pref ? pref.enabled : true; // default aan
  };

  const kanaalBeschikbaar = (channel: NotificationChannel) => {
    if (channel === "PUSH") return cfg.can.pushMeldingen;
    if (channel === "TELEGRAM") return cfg.can.telegram;
    return true;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Type</th>
            {CHANNELS.map(([c, label]) => (
              <th key={c} className="px-2 py-2 text-center font-medium">
                {label}
                {!kanaalBeschikbaar(c) && <span className="block text-[10px]">(hoger pakket)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TYPES.map(([type, label]) => (
            <tr key={type} className="border-b last:border-0">
              <td className="py-2 pr-4">{label}</td>
              {CHANNELS.map(([channel]) => (
                <td key={channel} className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    disabled={pending || !kanaalBeschikbaar(channel)}
                    defaultChecked={isEnabled(type, channel) && kanaalBeschikbaar(channel)}
                    onChange={(e) =>
                      startTransition(() =>
                        void toggleNotificationPref(type, channel, e.target.checked),
                      )
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
