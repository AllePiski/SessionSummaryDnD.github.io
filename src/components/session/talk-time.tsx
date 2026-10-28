"use client";

import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { characterColor } from "@/lib/colors";
import { formatDuration } from "@/lib/format";
import type { SpeakerStat } from "@/lib/screenplay";
import type { Character } from "@/lib/types";

/**
 * Tempo di parola per personaggio: barre sottili con valore sempre visibile
 * (il colore identifica, ma nome e numeri sono scritti).
 */
export function TalkTime({
  stats,
  characters,
  totalMs,
}: {
  stats: SpeakerStat[];
  characters: Map<string, Character>;
  totalMs: number;
}) {
  const max = Math.max(...stats.map((s) => s.talkMs), 1);
  if (stats.length === 0) {
    return <p className="text-sm text-muted-foreground">Ancora nessun dato.</p>;
  }
  return (
    <ul className="grid gap-3">
      {stats.map((s) => {
        const c = characters.get(s.id);
        const share = totalMs > 0 ? Math.round((s.talkMs / totalMs) * 100) : 0;
        return (
          <li key={s.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1">
            <CharacterAvatar character={c} className="row-span-2 size-7" />
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate font-medium">{c?.name ?? "Sconosciuto"}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular">
                {formatDuration(s.talkMs)} · {share}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-(--track)">
              <div
                className="h-2 rounded-r-[4px] rounded-l-[2px]"
                style={{ width: `${(s.talkMs / max) * 100}%`, background: characterColor(c) }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
