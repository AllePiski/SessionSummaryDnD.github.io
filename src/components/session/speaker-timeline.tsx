"use client";

import { useMemo, useRef, useState } from "react";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { usePlayerActions, usePlayerState } from "./player";
import { characterColor } from "@/lib/colors";
import { formatClock } from "@/lib/format";
import type { Character, Session } from "@/lib/types";

interface Lane {
  character: Character;
  segments: { start: number; end: number; group: number }[];
}

/** Passo delle tacche: al massimo ~8 etichette, da 10 secondi a 2 ore. */
function tickStep(durationMs: number): number {
  const steps = [10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600].map((s) => s * 1000);
  return steps.find((s) => durationMs / s <= 8) ?? 7_200_000;
}

/**
 * Una corsia per personaggio con i momenti in cui parla: si legge a colpo
 * d'occhio chi ha parlato quando (le discussioni compaiono su più corsie).
 * Cliccando su una corsia l'audio salta a quel punto.
 */
export function SpeakerTimeline({
  session,
  characters,
}: {
  session: Session;
  characters: Map<string, Character>;
}) {
  const { currentMs } = usePlayerState();
  const { seek, ready } = usePlayerActions();
  const trackRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; label: string } | null>(null);
  const duration = Math.max(session.durationMs, 1);

  const lanes = useMemo<Lane[]>(() => {
    const byId = new Map<string, Lane>();
    session.turns.forEach((turn) => {
      for (const id of turn.speakerIds) {
        const character = characters.get(id);
        if (!character) continue;
        let lane = byId.get(id);
        if (!lane) {
          lane = { character, segments: [] };
          byId.set(id, lane);
        }
        lane.segments.push({ start: turn.start, end: turn.end, group: turn.speakerIds.length });
      }
    });
    const order = { master: 0, pc: 1, npc: 2 } as const;
    return [...byId.values()].sort(
      (a, b) => order[a.character.kind] - order[b.character.kind] || a.character.order - b.character.order,
    );
  }, [session.turns, characters]);

  const ticks = useMemo(() => {
    const step = tickStep(duration);
    const out: number[] = [];
    for (let t = 0; t <= duration; t += step) out.push(t);
    return out;
  }, [duration]);

  // le corsie non dipendono dalla posizione di ascolto: si calcolano una volta sola
  const laneMarks = useMemo(
    () =>
      lanes.map(({ character, segments }) => (
        <div key={character.id} className="relative h-6 rounded-[4px] bg-(--track)">
          {segments.map((s, i) => (
            <span
              key={i}
              className="absolute inset-y-1 rounded-[3px]"
              style={{
                left: `${(s.start / duration) * 100}%`,
                width: `max(2px, ${((s.end - s.start) / duration) * 100}%)`,
                background: characterColor(character),
                opacity: s.group > 1 ? 0.65 : 1,
              }}
            />
          ))}
        </div>
      )),
    [lanes, duration],
  );

  function timeAt(clientX: number): number | null {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }

  if (lanes.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nessun turno di parola registrato.</p>;
  }

  const pct = (ms: number) => `${(ms / duration) * 100}%`;

  return (
    <div className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] gap-x-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
      <div className="grid gap-1.5">
        {lanes.map(({ character }) => (
          <div key={character.id} className="flex h-6 min-w-0 items-center gap-2">
            <CharacterAvatar character={character} className="size-5" />
            <span className="truncate text-xs font-medium">{character.name}</span>
          </div>
        ))}
      </div>
      <div className="relative">
        <div
          ref={trackRef}
          className="relative grid cursor-pointer gap-1.5"
          onPointerMove={(e) => {
            const t = timeAt(e.clientX);
            const rect = trackRef.current?.getBoundingClientRect();
            if (t === null || !rect) return;
            const laneIndex = Math.floor((e.clientY - rect.top) / (rect.height / lanes.length));
            const lane = lanes[Math.min(lanes.length - 1, Math.max(0, laneIndex))];
            const seg = lane?.segments.find((s) => t >= s.start && t <= s.end);
            const who = seg ? `${lane.character.name}${seg.group > 1 ? " (discussione)" : ""} · ` : "";
            setHover({ x: e.clientX - rect.left, label: `${who}${formatClock(t)}` });
          }}
          onPointerLeave={() => setHover(null)}
          onClick={(e) => {
            const t = timeAt(e.clientX);
            if (t !== null && ready) seek(t, true);
          }}
          role="slider"
          aria-label="Timeline dei personaggi: clicca per ascoltare da quel punto"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration / 1000)}
          aria-valuenow={Math.round(currentMs / 1000)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") seek(currentMs + 10_000);
            if (e.key === "ArrowLeft") seek(currentMs - 10_000);
          }}
        >
          {ticks.map((t) => (
            <span key={t} className="pointer-events-none absolute inset-y-0 w-px bg-border" style={{ left: pct(t) }} />
          ))}
          {laneMarks}
          <span
            className="pointer-events-none absolute -inset-y-1 w-0.5 rounded-full bg-foreground"
            style={{ left: pct(Math.min(currentMs, duration)) }}
          />
          {hover && (
            <span
              className="pointer-events-none absolute -top-8 z-10 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow"
              style={{ left: hover.x }}
            >
              {hover.label}
            </span>
          )}
        </div>
        <div className="relative mt-1.5 h-4 text-[10px] text-muted-foreground tabular">
          {ticks.map((t, i) => (
            <span
              key={t}
              className={i === 0 ? "absolute left-0" : "absolute -translate-x-1/2"}
              style={i === 0 ? undefined : { left: pct(t) }}
            >
              {formatClock(t)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
