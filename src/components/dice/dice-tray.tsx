"use client";

import { DieFace, RollingDie } from "./die-face";
import { physicalDice, type PlannedDie } from "./use-dice-roll";
import { groupColor, type DiceGroup, type RollResult } from "@/lib/dice";
import { cn } from "@/lib/utils";

function diceSize(count: number) {
  if (count <= 6) return "size-16 sm:size-[72px]";
  if (count <= 14) return "size-14";
  if (count <= 30) return "size-11";
  return "size-9";
}

/**
 * Il tappeto verde: prima del lancio mostra i dadi pronti, poi quelli che
 * rotolano. Il risultato viene annunciato dal riepilogo, non da qui.
 */
export function DiceTray({
  groups,
  roll,
  dice,
  rollKey,
  animated,
}: {
  groups: DiceGroup[];
  roll: RollResult | null;
  dice: PlannedDie[];
  rollKey: number;
  animated: boolean;
}) {
  const size = diceSize(roll ? dice.length : groups.reduce((sum, g) => sum + physicalDice(g), 0));
  return (
    <div
      className="relative flex min-h-48 flex-wrap content-center items-center justify-center gap-3 overflow-hidden rounded-2xl p-5 shadow-[inset_0_2px_18px_rgba(0,0,0,.55)] ring-1 ring-black/30"
      style={{
        background: "radial-gradient(ellipse at 50% 35%, color-mix(in oklch, #2f6b4f 92%, white), #1b3d2d 55%, #10261c)",
      }}
    >
      {roll
        ? dice.map((d) => (
            <RollingDie
              key={`${rollKey}-${d.key}`}
              sides={d.sides}
              value={d.value}
              color={d.color}
              animate={animated}
              delay={d.delay}
              duration={d.duration}
              highlight={d.highlight}
              discarded={d.discarded}
              className={size}
            />
          ))
        : groups.flatMap((g, gi) =>
            Array.from({ length: physicalDice(g) }, (_, i) => (
              <DieFace
                key={`${g.id}-${i}`}
                sides={g.sides}
                value={null}
                color={groupColor(g.label, gi)}
                className={cn(size, "opacity-70")}
              />
            )),
          )}
      {!roll && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-white/70">
          Pronti sul tappeto: premi Lancia
        </span>
      )}
    </div>
  );
}
