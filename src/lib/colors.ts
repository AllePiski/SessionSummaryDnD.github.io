import type { Character } from "./types";

/**
 * Colori identificativi dei personaggi. I valori stanno in globals.css
 * (--char-gold, --char-1…7, --char-neutral) con varianti chiare/scure.
 * L'ordine degli slot è stato validato per la distinguibilità anche con
 * daltonismo; il colore non è mai l'unico segnale (c'è sempre nome/avatar).
 */
const PC_COLOR_SLOTS = 7;

export function characterColor(c: Pick<Character, "kind" | "colorSlot"> | undefined): string {
  if (!c) return "var(--char-neutral)";
  if (c.kind === "master") return "var(--char-gold)";
  if (c.colorSlot >= 0 && c.colorSlot < PC_COLOR_SLOTS) return `var(--char-${c.colorSlot + 1})`;
  return "var(--char-neutral)";
}

/** Primo slot libero tra i personaggi giocanti attivi, -1 se finiti. */
export function nextColorSlot(characters: Character[]): number {
  const used = new Set(
    characters.filter((c) => c.kind === "pc" && !c.archived).map((c) => c.colorSlot),
  );
  for (let i = 0; i < PC_COLOR_SLOTS; i++) if (!used.has(i)) return i;
  return -1;
}
