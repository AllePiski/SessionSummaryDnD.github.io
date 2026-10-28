import { characterColor } from "@/lib/colors";
import type { Character } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RaceAvatar } from "./race-avatar";

type AvatarSource = Pick<Character, "name" | "raceId" | "gender" | "photo"> &
  Partial<Pick<Character, "kind" | "colorSlot">>;

/**
 * Foto o avatar della razza di un personaggio.
 * - `showColor`: pallino col colore identificativo (bordo dello stesso colore dello sfondo, `ringClassName`).
 * - `decorative` (predefinito): il nome è già scritto accanto, quindi l'immagine non viene annunciata.
 */
export function CharacterAvatar({
  character,
  className,
  showColor = false,
  ringClassName = "ring-card",
  decorative = true,
}: {
  character: AvatarSource | undefined;
  className?: string;
  showColor?: boolean;
  ringClassName?: string;
  decorative?: boolean;
}) {
  const label = decorative ? undefined : character?.name;
  const avatar = character?.photo ? (
    // eslint-disable-next-line @next/next/no-img-element -- foto locale in data URL
    <img
      src={character.photo}
      alt={label ?? ""}
      className={cn("aspect-square shrink-0 rounded-full object-cover", className)}
    />
  ) : (
    <RaceAvatar
      raceId={character?.raceId ?? "umano"}
      gender={character?.gender ?? "m"}
      title={label}
      className={cn("aspect-square shrink-0 rounded-full", className)}
    />
  );

  if (!showColor || !character?.kind) return avatar;
  return (
    <span className="relative inline-flex shrink-0">
      {avatar}
      <span
        aria-hidden
        className={cn("absolute right-[3%] bottom-[3%] size-[22%] min-h-2 min-w-2 rounded-full ring-2", ringClassName)}
        style={{ background: characterColor({ kind: character.kind, colorSlot: character.colorSlot ?? -1 }) }}
      />
    </span>
  );
}

/** Avatar sovrapposti (per elenchi di partecipanti senza nomi accanto). */
export function AvatarStack({
  characters,
  max = 5,
  className,
  size = "size-7",
}: {
  characters: AvatarSource[];
  max?: number;
  className?: string;
  size?: string;
}) {
  const shown = characters.slice(0, max);
  const rest = characters.length - shown.length;
  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {shown.map((c, i) => (
        <CharacterAvatar
          key={`${c.name}-${i}`}
          character={c}
          decorative={false}
          className={cn(size, "ring-2 ring-card")}
        />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            size,
            "grid place-items-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-card",
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
