"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { setSetting } from "@/lib/repo";
import { SETTING_LIVE_TIPS_SEEN } from "@/lib/settings";

const TIPS = [
  { title: "Tocca chi parla", text: "Il personaggio si illumina e da lì in poi il turno è suo." },
  { title: "Discussione", text: "Più voci insieme: premi Discussione e tocca chi partecipa (o Maiusc + tocco)." },
  { title: "Nessuno", text: "Per pause e chiacchiere fuori gioco." },
];

/** Suggerimenti mostrati alla prima registrazione, finché non vengono chiusi. */
export function FirstRecordingTips() {
  // undefined mentre carica (niente lampo), null se non ancora chiusi
  const seen = useLiveQuery(async () => (await db.settings.get(SETTING_LIVE_TIPS_SEEN)) ?? null, []);
  if (seen !== null) return null;
  return (
    <div className="relative grid gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 pr-12 sm:grid-cols-[auto_1fr]">
      <Lightbulb className="size-5 text-primary" />
      <div className="grid gap-2 sm:grid-cols-3">
        {TIPS.map((t) => (
          <p key={t.title} className="text-sm">
            <span className="font-semibold">{t.title}</span>
            <span className="block text-muted-foreground">{t.text}</span>
          </p>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2"
        onClick={() => void setSetting(SETTING_LIVE_TIPS_SEEN, true)}
        aria-label="Ho capito, nascondi i suggerimenti"
      >
        <X />
      </Button>
    </div>
  );
}
