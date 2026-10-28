import { raceLabel } from "./races";
import type { Character } from "./types";

const KIND_RANK = { master: 0, pc: 1, npc: 2 } as const;

/** Posizione del tipo di personaggio: prima il master, poi il party, poi i PNG. */
export function kindRank(c: Pick<Character, "kind">): number {
  return KIND_RANK[c.kind];
}

/** Ordine standard: master, party nell'ordine di creazione, PNG. */
export function compareCharacters(a: Character, b: Character): number {
  return kindRank(a) - kindRank(b) || a.order - b.order;
}

export function splitByKind(characters: Character[]) {
  return {
    master: characters.find((c) => c.kind === "master"),
    pcs: characters.filter((c) => c.kind === "pc"),
    npcs: characters.filter((c) => c.kind === "npc"),
  };
}

/** Riga sotto il nome: "Master", oppure es. "Giulia · Elfa · Mago". */
export function characterSubtitle(
  c: Character,
  { withPlayer = false, withClass = false }: { withPlayer?: boolean; withClass?: boolean } = {},
): string {
  if (c.kind === "master") return "Master";
  return [withPlayer ? c.playerName : undefined, raceLabel(c.raceId, c.gender), withClass ? c.className : undefined]
    .filter(Boolean)
    .join(" · ");
}
