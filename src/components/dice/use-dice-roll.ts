"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_DICE_PER_GROUP,
  MAX_GROUPS,
  effectiveMode,
  newGroup,
  rollGroups,
  type DiceGroup,
  type DieSides,
  type RollMode,
  type RollResult,
} from "@/lib/dice";
import { setSetting } from "@/lib/repo";
import { SETTING_DICE } from "@/lib/settings";

const HISTORY_SIZE = 15;

export interface SavedDice {
  groups: DiceGroup[];
  history: RollResult[];
}

/** Un dado sul tappeto, con i tempi della sua animazione. */
export interface PlannedDie {
  key: string;
  sides: number;
  value: number;
  color: string;
  delay: number;
  duration: number;
  highlight?: "max" | "min";
  /** tiro scartato per vantaggio/svantaggio */
  discarded?: boolean;
}

/** Dadi fisici sul tappeto: con vantaggio/svantaggio ogni d20 vale doppio. */
export function physicalDice(g: DiceGroup) {
  return g.count * (effectiveMode(g) === "normal" ? 1 : 2);
}

function plan(roll: RollResult, animate: boolean): PlannedDie[] {
  const dice: PlannedDie[] = [];
  const push = (key: string, sides: number, value: number, color: string, extra: Partial<PlannedDie>) => {
    const n = dice.length;
    dice.push({
      key,
      sides,
      value,
      color,
      delay: animate ? Math.min(n * 55, 650) : 0,
      duration: animate ? 950 + Math.random() * 350 : 0,
      ...extra,
    });
  };
  roll.groups.forEach((g) =>
    g.values.forEach((value, i) => {
      const highlight = g.sides === 20 ? (value === 20 ? "max" : value === 1 ? "min" : undefined) : undefined;
      push(`${g.groupId}-${i}`, g.sides, value, g.color, { highlight });
      const other = g.discarded?.[i];
      if (other !== undefined) push(`${g.groupId}-${i}-x`, g.sides, other, g.color, { discarded: true });
    }),
  );
  return dice;
}

/** Stato del tiro dei dadi: gruppi, lancio animato e storico (salvato solo se `persist`). */
export function useDiceRoll({
  persist,
  initialGroups,
  initialHistory,
}: {
  persist: boolean;
  initialGroups: DiceGroup[];
  initialHistory: RollResult[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [history, setHistory] = useState(initialHistory);
  const [roll, setRoll] = useState<RollResult | null>(initialHistory[0] ?? null);
  const [dice, setDice] = useState<PlannedDie[]>(() => (initialHistory[0] ? plan(initialHistory[0], false) : []));
  const [rollKey, setRollKey] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [animated, setAnimated] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<SavedDice>({ groups, history });

  // salvataggio con un piccolo ritardo mentre si scrive, e comunque quando si lascia la pagina
  useEffect(() => {
    latest.current = { groups, history };
    if (!persist) return;
    const t = setTimeout(() => void setSetting(SETTING_DICE, latest.current), 400);
    return () => clearTimeout(t);
  }, [persist, groups, history]);

  useEffect(
    () => () => {
      if (persist) void setSetting(SETTING_DICE, latest.current);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [persist],
  );

  function updateGroup(id: string, patch: Partial<DiceGroup>) {
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function removeGroup(id: string) {
    setGroups((gs) => gs.filter((g) => g.id !== id));
  }

  function addGroup() {
    setGroups((gs) => (gs.length >= MAX_GROUPS ? gs : [...gs, newGroup(gs.at(-1)?.sides ?? 6)]));
  }

  function reset() {
    setGroups([newGroup(20)]);
  }

  /** Aggiunge un dado: si somma all'ultimo gruppo se è dello stesso tipo e senza scopo. */
  function addDie(sides: DieSides, mode: RollMode = "normal") {
    setGroups((gs) => {
      const last = gs.at(-1);
      if (
        last &&
        last.sides === sides &&
        effectiveMode(last) === mode &&
        !last.label.trim() &&
        last.modifier === 0 &&
        last.count < MAX_DICE_PER_GROUP
      ) {
        return gs.map((g) => (g === last ? { ...g, count: g.count + 1 } : g));
      }
      if (gs.length >= MAX_GROUPS) return gs;
      // il d20 "vuoto" di partenza viene sostituito dal primo dado scelto
      const first = gs[0];
      const pristine =
        gs.length === 1 &&
        first.count === 1 &&
        first.sides === 20 &&
        effectiveMode(first) === "normal" &&
        !first.label &&
        !first.modifier;
      if (pristine && !roll) return [newGroup(sides, 1, mode)];
      return [...gs, newGroup(sides, 1, mode)];
    });
  }

  function rollDice(source: DiceGroup[] = groups) {
    const valid = source.filter((g) => g.count > 0);
    if (valid.length === 0 || animating) return;
    const result = rollGroups(valid);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const planned = plan(result, !reduceMotion);
    setRoll(result);
    setDice(planned);
    setRollKey((k) => k + 1);
    setAnimated(!reduceMotion);
    setHistory((h) => [result, ...h].slice(0, HISTORY_SIZE));
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (reduceMotion) {
      setAnimating(false);
      return;
    }
    setAnimating(true);
    const end = Math.max(...planned.map((d) => d.delay + d.duration * 0.82)) + 120;
    settleTimer.current = setTimeout(() => setAnimating(false), end);
  }

  /** Ripete un lancio dello storico (stessi gruppi, scopi e modificatori). */
  function repeat(past: RollResult) {
    if (animating) return;
    const next = past.groups.map((g) => ({
      ...newGroup(g.sides, g.count, g.mode ?? "normal"),
      label: g.label,
      modifier: g.modifier,
    }));
    setGroups(next);
    rollDice(next);
  }

  return {
    groups,
    history,
    roll,
    dice,
    rollKey,
    animating,
    animated,
    totalDice: groups.reduce((sum, g) => sum + physicalDice(g), 0),
    addDie,
    addGroup,
    updateGroup,
    removeGroup,
    reset,
    rollDice,
    repeat,
    clearHistory: () => setHistory([]),
  };
}
