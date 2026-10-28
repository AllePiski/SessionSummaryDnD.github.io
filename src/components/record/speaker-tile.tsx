"use client";

import { Check, Plus } from "lucide-react";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { characterColor } from "@/lib/colors";
import { raceLabel } from "@/lib/races";
import type { Character } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SpeakerTile({
  character,
  active,
  selecting,
  checked,
  shortcut,
  onClick,
}: {
  character: Character;
  active: boolean;
  selecting: boolean;
  checked: boolean;
  shortcut?: string;
  onClick: () => void;
}) {
  const color = characterColor(character);
  const subtitle =
    character.kind === "master"
      ? "Master"
      : character.kind === "npc"
        ? "PNG"
        : raceLabel(character.raceId, character.gender);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selecting ? checked : active}
      style={{ "--speaker": color } as React.CSSProperties}
      className={cn(
        "group relative flex flex-col items-center gap-3 rounded-2xl border bg-card px-3 pt-5 pb-4 text-center transition-all duration-200 outline-none select-none",
        "hover:-translate-y-0.5 hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring active:translate-y-0",
        active &&
          !selecting &&
          "border-transparent bg-[color-mix(in_oklch,var(--speaker)_18%,var(--card))] shadow-lg ring-2 ring-(--speaker)",
        selecting && checked && "border-transparent bg-[color-mix(in_oklch,var(--speaker)_12%,var(--card))] ring-2 ring-(--speaker)",
        selecting && !checked && "opacity-60",
      )}
    >
      {shortcut && (
        <kbd className="absolute top-2 left-2 hidden min-w-5 rounded border bg-muted px-1 text-[10px] leading-4 text-muted-foreground md:block">
          {shortcut}
        </kbd>
      )}
      <div className={cn("relative rounded-full transition-transform duration-200", active && !selecting && "scale-105 speaking-ring")}>
        <CharacterAvatar
          character={character}
          className={cn(
            "size-20 sm:size-24",
            !active && !selecting && "opacity-90 saturate-[.85] group-hover:opacity-100 group-hover:saturate-100",
          )}
        />
        {selecting && (
          <span
            className={cn(
              "absolute -top-1 -right-1 grid size-7 place-items-center rounded-full border-2 border-card shadow",
              checked ? "bg-(--speaker) text-white" : "bg-muted text-transparent",
            )}
          >
            <Check className="size-4" strokeWidth={3} />
          </span>
        )}
        {active && !selecting && (
          <span className="absolute -bottom-2 left-1/2 flex h-5 -translate-x-1/2 items-end gap-[3px] rounded-full bg-card px-2 py-1 shadow ring-1 ring-border">
            {[0, 0.2, 0.4].map((delay) => (
              <span key={delay} className="eq-bar h-full w-[3px] rounded-full bg-(--speaker)" style={{ animationDelay: `${delay}s` }} />
            ))}
          </span>
        )}
      </div>
      <div className="w-full min-w-0">
        <div className="truncate font-semibold">{character.name}</div>
        <div className={cn("truncate text-xs", active && !selecting ? "font-medium text-foreground" : "text-muted-foreground")}>
          {active && !selecting ? "Sta parlando" : subtitle}
        </div>
      </div>
    </button>
  );
}

export function AddSpeakerTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-4 text-muted-foreground transition-colors outline-none hover:border-foreground/30 hover:bg-accent/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
    >
      <span className="grid size-16 place-items-center rounded-full border border-dashed">
        <Plus className="size-6" />
      </span>
      <span className="text-sm font-medium">Aggiungi personaggio</span>
    </button>
  );
}
