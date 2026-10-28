import { cn } from "@/lib/utils";
import type { Character } from "@/lib/types";
import { RaceAvatar } from "./race-avatar";

type AvatarSource = Pick<Character, "name" | "raceId" | "gender" | "photo">;

export function CharacterAvatar({
  character,
  className,
}: {
  character: AvatarSource | undefined;
  className?: string;
}) {
  if (character?.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- foto locale in data URL
      <img
        src={character.photo}
        alt={character.name}
        className={cn("aspect-square shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <RaceAvatar
      raceId={character?.raceId ?? "umano"}
      gender={character?.gender ?? "m"}
      title={character?.name}
      className={cn("aspect-square shrink-0 rounded-full", className)}
    />
  );
}

/** Avatar sovrapposti (per elenchi di partecipanti). */
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
        <CharacterAvatar key={`${c.name}-${i}`} character={c} className={cn(size, "ring-2 ring-card")} />
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
