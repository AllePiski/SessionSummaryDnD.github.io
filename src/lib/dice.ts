import { uid } from "./format";

export const DIE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
export type DieSides = (typeof DIE_SIDES)[number];

export const MAX_DICE_PER_GROUP = 20;
export const MAX_GROUPS = 8;

/** Un gruppo di dadi uguali con uno scopo opzionale (es. "2d8 Fuoco +3"). */
export interface DiceGroup {
  id: string;
  count: number;
  sides: DieSides;
  /** a cosa serve il tiro: tipo di danno, attacco, tiro salvezza… */
  label: string;
  modifier: number;
}

export interface GroupResult {
  groupId: string;
  count: number;
  sides: DieSides;
  label: string;
  modifier: number;
  color: string;
  values: number[];
  subtotal: number;
}

export interface RollResult {
  id: string;
  at: number;
  groups: GroupResult[];
  total: number;
}

/** Suggerimenti per l'etichetta: tipi di danno di D&D 5e e tiri comuni. */
export const ROLL_PURPOSES = [
  "Fuoco",
  "Freddo",
  "Ghiaccio",
  "Fulmine",
  "Tuono",
  "Acido",
  "Veleno",
  "Necrotico",
  "Radioso",
  "Psichico",
  "Forza",
  "Tagliente",
  "Perforante",
  "Contundente",
  "Attacco",
  "Tiro salvezza",
  "Prova di abilità",
  "Iniziativa",
  "Guarigione",
];

const PURPOSE_COLORS: [RegExp, string][] = [
  [/fuoco|fiamm|incend|brac/, "#e8590c"],
  [/fredd|ghiacc|gel|neve/, "#3b9ae1"],
  [/fulmin|elettr|lampo/, "#e5a50a"],
  [/tuon|sonic/, "#4c6ef5"],
  [/acid/, "#74b816"],
  [/velen|tossic/, "#2b8a3e"],
  [/necro|ombr|morte/, "#5f3dc4"],
  [/radios|sacr|luce|divin/, "#d4a017"],
  [/psich|mental/, "#d6336c"],
  [/forza|arcan/, "#9c36b5"],
  [/tagli|perfor|contund|fisic|arma/, "#7c828a"],
  [/guarig|cura|vita/, "#12b886"],
];

/** Colori per i gruppi senza un tipo riconosciuto, assegnati in ordine. */
const GROUP_COLORS = ["#7048e8", "#1c7ed6", "#c2255c", "#0c8599", "#e67700", "#5c940d", "#862e9c", "#495057"];

export function groupColor(label: string, index: number): string {
  const key = label.trim().toLowerCase();
  if (key) {
    const match = PURPOSE_COLORS.find(([re]) => re.test(key));
    if (match) return match[1];
  }
  return GROUP_COLORS[index % GROUP_COLORS.length];
}

export function newGroup(sides: DieSides = 20, count = 1): DiceGroup {
  return { id: uid(), count, sides, label: "", modifier: 0 };
}

/** Intero casuale 1..sides senza distorsione (crypto + rifiuto dei valori in eccesso). */
export function rollDie(sides: number): number {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    return 1 + Math.floor(Math.random() * sides);
  }
  const limit = Math.floor(0x1_0000_0000 / sides) * sides;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return 1 + (buf[0] % sides);
}

export function rollGroups(groups: DiceGroup[]): RollResult {
  const results = groups.map((g, i) => {
    const values = Array.from({ length: g.count }, () => rollDie(g.sides));
    return {
      groupId: g.id,
      count: g.count,
      sides: g.sides,
      label: g.label.trim(),
      modifier: g.modifier,
      color: groupColor(g.label, i),
      values,
      subtotal: values.reduce((a, b) => a + b, 0) + g.modifier,
    };
  });
  return { id: uid(), at: Date.now(), groups: results, total: results.reduce((a, r) => a + r.subtotal, 0) };
}

function signed(n: number): string {
  return n > 0 ? ` + ${n}` : n < 0 ? ` − ${Math.abs(n)}` : "";
}

/** "1d8 Fuoco + 1d8 Ghiaccio + 2d6 + 3" */
export function formatFormula(groups: Pick<DiceGroup, "count" | "sides" | "label" | "modifier">[]): string {
  return groups
    .map((g, i) => `${i > 0 ? " + " : ""}${g.count}d${g.sides}${g.label.trim() ? ` ${g.label.trim()}` : ""}${signed(g.modifier)}`)
    .join("");
}

/** Totali raggruppati per scopo (utile per resistenze e vulnerabilità ai danni). */
export function totalsByPurpose(roll: RollResult): { label: string; color: string; total: number }[] {
  const map = new Map<string, { label: string; color: string; total: number }>();
  for (const g of roll.groups) {
    const key = g.label.toLowerCase() || "__none__";
    const entry = map.get(key);
    if (entry) entry.total += g.subtotal;
    else map.set(key, { label: g.label || "Senza scopo", color: g.color, total: g.subtotal });
  }
  return [...map.values()];
}
