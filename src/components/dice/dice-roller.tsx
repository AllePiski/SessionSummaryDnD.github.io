"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { ChevronsDown, ChevronsUp, Dices, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DiceTray } from "./dice-tray";
import { DieFace } from "./die-face";
import { GroupRow } from "./group-row";
import { RollHistory } from "./roll-history";
import { RollSummary } from "./roll-summary";
import { useDiceRoll, type SavedDice } from "./use-dice-roll";
import { useCharacters } from "@/hooks/use-data";
import { db } from "@/lib/db";
import {
  DIE_SIDES,
  MAX_GROUPS,
  ROLL_PURPOSES,
  formatFormula,
  groupColor,
  newGroup,
  type DiceGroup,
  type RollResult,
} from "@/lib/dice";
import { SETTING_DICE } from "@/lib/settings";

/**
 * Tiro dei dadi, anche misti e con uno scopo per gruppo. Usabile da tutti:
 * con un party lancio e storico restano salvati, senza party no.
 * `bare` toglie la card esterna (per usarlo dentro un pannello laterale).
 */
export function DiceRoller({ bare = false }: { bare?: boolean }) {
  const characters = useCharacters();
  const stored = useLiveQuery(async () => (await db.settings.get(SETTING_DICE)) ?? null, []);
  if (stored === undefined || characters === undefined) {
    return <div className="h-80 animate-pulse rounded-xl bg-muted/50" aria-busy />;
  }
  const persist = characters.some((c) => c.kind === "pc");
  const saved = persist ? (stored?.value as SavedDice | undefined) : undefined;
  return (
    <DiceRollerBody
      key={persist ? "saved" : "temporary"}
      bare={bare}
      persist={persist}
      initialGroups={saved?.groups?.length ? saved.groups : [newGroup(20)]}
      initialHistory={saved?.history ?? []}
    />
  );
}

function DiceRollerBody({
  bare,
  persist,
  initialGroups,
  initialHistory,
}: {
  bare: boolean;
  persist: boolean;
  initialGroups: DiceGroup[];
  initialHistory: RollResult[];
}) {
  const dice = useDiceRoll({ persist, initialGroups, initialHistory });
  const { groups, roll, animating } = dice;

  const content = (
    <div className="@container">
      <div className="grid gap-6 @3xl:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="grid min-w-0 content-start gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-sm text-muted-foreground">Aggiungi</span>
            {DIE_SIDES.map((sides) => (
              <Button
                key={sides}
                type="button"
                variant="outline"
                className="h-10 gap-1.5 px-2"
                onClick={() => dice.addDie(sides)}
                aria-label={`Aggiungi un d${sides}`}
              >
                <DieFace sides={sides} value={null} color="var(--muted-foreground)" icon className="size-6" />d{sides}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-1 px-2"
              onClick={() => dice.addDie(20, "advantage")}
              title="Tira 2d20 e tieni il più alto"
            >
              <ChevronsUp className="text-success" /> d20 Vantaggio
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-1 px-2"
              onClick={() => dice.addDie(20, "disadvantage")}
              title="Tira 2d20 e tieni il più basso"
            >
              <ChevronsDown className="text-destructive" /> d20 Svantaggio
            </Button>
          </div>

          <form
            className="grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              dice.rollDice();
            }}
          >
            {groups.map((g, i) => (
              <GroupRow
                key={g.id}
                group={g}
                color={groupColor(g.label, i)}
                canRemove={groups.length > 1}
                onChange={(patch) => dice.updateGroup(g.id, patch)}
                onRemove={() => dice.removeGroup(g.id)}
              />
            ))}
            <datalist id="dice-purposes">
              {ROLL_PURPOSES.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" disabled={groups.length >= MAX_GROUPS} onClick={dice.addGroup}>
                <Plus /> Nuovo gruppo
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={dice.reset}>
                <RotateCcw /> Ricomincia
              </Button>
              <Button
                type="submit"
                size="lg"
                className="ml-auto h-11 gap-2 px-5 text-base"
                disabled={animating || dice.totalDice === 0}
              >
                <Dices className="size-5" /> Lancia {formatFormula(groups.filter((g) => g.count > 0))}
              </Button>
            </div>
          </form>

          <DiceTray groups={groups} roll={roll} dice={dice.dice} rollKey={dice.rollKey} animated={dice.animated} />

          <div className="min-h-24" aria-live="polite" aria-atomic>
            {roll && !animating ? (
              <RollSummary roll={roll} />
            ) : roll ? (
              <p className="pt-6 text-center text-sm text-muted-foreground">I dadi rotolano…</p>
            ) : null}
          </div>
        </div>

        <RollHistory persist={persist} history={dice.history} onRepeat={dice.repeat} onClear={dice.clearHistory} />
      </div>
    </div>
  );

  if (bare) return content;
  return (
    <Card>
      <CardContent className="py-2">{content}</CardContent>
    </Card>
  );
}
