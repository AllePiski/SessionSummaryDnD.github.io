"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronsDown, ChevronsUp, Dices, History, Minus, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DieFace, RollingDie } from "./die-face";
import { db } from "@/lib/db";
import {
  DIE_SIDES,
  MAX_DICE_PER_GROUP,
  MAX_GROUPS,
  MODE_LABELS,
  ROLL_PURPOSES,
  effectiveMode,
  formatFormula,
  groupColor,
  newGroup,
  rollGroups,
  totalsByPurpose,
  type DiceGroup,
  type DieSides,
  type RollMode,
  type RollResult,
} from "@/lib/dice";
import { setSetting } from "@/lib/repo";
import { cn } from "@/lib/utils";

const DICE_KEY = "dice";
const HISTORY_SIZE = 15;

interface SavedDice {
  groups: DiceGroup[];
  history: RollResult[];
}

interface PlannedDie {
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

/** Sezione della dashboard per tirare i dadi, anche misti e con uno scopo per gruppo. */
export function DiceRoller() {
  const stored = useLiveQuery(async () => (await db.settings.get(DICE_KEY)) ?? null, []);
  if (stored === undefined) {
    return <Card className="h-80 animate-pulse" aria-busy />;
  }
  const saved = stored?.value as SavedDice | undefined;
  return (
    <DiceRollerBody
      initialGroups={saved?.groups?.length ? saved.groups : [newGroup(20)]}
      initialHistory={saved?.history ?? []}
    />
  );
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

/** Dadi fisici sul tappeto: con vantaggio/svantaggio ogni d20 vale doppio. */
function physicalDice(g: DiceGroup) {
  return g.count * (effectiveMode(g) === "normal" ? 1 : 2);
}

function diceSize(count: number) {
  if (count <= 6) return "size-16 sm:size-[72px]";
  if (count <= 14) return "size-14";
  if (count <= 30) return "size-11";
  return "size-9";
}

function DiceRollerBody({ initialGroups, initialHistory }: { initialGroups: DiceGroup[]; initialHistory: RollResult[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [history, setHistory] = useState(initialHistory);
  const [roll, setRoll] = useState<RollResult | null>(initialHistory[0] ?? null);
  const [dice, setDice] = useState<PlannedDie[]>(() => (initialHistory[0] ? plan(initialHistory[0], false) : []));
  const [rollKey, setRollKey] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [animated, setAnimated] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // salvataggio (con un piccolo ritardo mentre si scrive)
  useEffect(() => {
    const t = setTimeout(() => void setSetting(DICE_KEY, { groups, history } satisfies SavedDice), 400);
    return () => clearTimeout(t);
  }, [groups, history]);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  const totalDice = groups.reduce((sum, g) => sum + physicalDice(g), 0);

  function update(id: string, patch: Partial<DiceGroup>) {
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

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
      // un d20 "vuoto" di partenza viene sostituito dal primo dado scelto
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

  function doRoll(source: DiceGroup[]) {
    const valid = source.filter((g) => g.count > 0);
    if (valid.length === 0) return;
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

  function repeat(past: RollResult) {
    const next = past.groups.map((g) => ({
      ...newGroup(g.sides, g.count, g.mode ?? "normal"),
      label: g.label,
      modifier: g.modifier,
    }));
    setGroups(next);
    doRoll(next);
  }

  const size = diceSize(roll ? dice.length : totalDice);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dices className="size-4 text-muted-foreground" /> Tiro dei dadi
        </CardTitle>
        <CardDescription>
          Scegli quanti dadi e di che tipo, anche misti. Se vuoi, indica a cosa serve ogni gruppo (es. 1d8 Fuoco + 1d8
          Ghiaccio): i totali restano separati.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="grid min-w-0 content-start gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-sm text-muted-foreground">Aggiungi</span>
            {DIE_SIDES.map((sides) => (
              <Button
                key={sides}
                type="button"
                variant="outline"
                className="h-10 gap-1.5 px-2"
                onClick={() => addDie(sides)}
                aria-label={`Aggiungi un d${sides}`}
              >
                <DieFace sides={sides} value={null} color="var(--muted-foreground)" icon className="size-6" />d{sides}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-1 px-2"
              onClick={() => addDie(20, "advantage")}
              title="Tira 2d20 e tieni il più alto"
            >
              <ChevronsUp className="text-[#0ca30c]" /> d20 Vantaggio
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-1 px-2"
              onClick={() => addDie(20, "disadvantage")}
              title="Tira 2d20 e tieni il più basso"
            >
              <ChevronsDown className="text-[#d03b3b]" /> d20 Svantaggio
            </Button>
          </div>

          <form
            className="grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!animating) doRoll(groups);
            }}
          >
            {groups.map((g, i) => (
              <GroupRow
                key={g.id}
                group={g}
                color={groupColor(g.label, i)}
                canRemove={groups.length > 1}
                onChange={(patch) => update(g.id, patch)}
                onRemove={() => setGroups((gs) => gs.filter((x) => x.id !== g.id))}
              />
            ))}
            <datalist id="dice-purposes">
              {ROLL_PURPOSES.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={groups.length >= MAX_GROUPS}
                onClick={() => setGroups((gs) => [...gs, newGroup(gs.at(-1)?.sides ?? 6)])}
              >
                <Plus /> Nuovo gruppo
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setGroups([newGroup(20)])}>
                <RotateCcw /> Ricomincia
              </Button>
              <Button type="submit" size="lg" className="ml-auto h-11 gap-2 px-5 text-base" disabled={animating || totalDice === 0}>
                <Dices className="size-5" /> Lancia {formatFormula(groups.filter((g) => g.count > 0))}
              </Button>
            </div>
          </form>

          <div
            className="relative flex min-h-48 flex-wrap content-center items-center justify-center gap-3 overflow-hidden rounded-2xl p-5 shadow-[inset_0_2px_18px_rgba(0,0,0,.55)] ring-1 ring-black/30"
            style={{
              background:
                "radial-gradient(ellipse at 50% 35%, color-mix(in oklch, #2f6b4f 92%, white), #1b3d2d 55%, #10261c)",
            }}
            aria-live="polite"
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

          <div className="min-h-24">
            {roll && !animating ? (
              <RollSummary roll={roll} />
            ) : roll ? (
              <p className="pt-6 text-center text-sm text-muted-foreground">I dadi rotolano…</p>
            ) : null}
          </div>
        </div>

        <RollHistory
          history={history}
          onRepeat={(r) => !animating && repeat(r)}
          onClear={() => setHistory([])}
        />
      </CardContent>
    </Card>
  );
}

function GroupRow({
  group,
  color,
  canRemove,
  onChange,
  onRemove,
}: {
  group: DiceGroup;
  color: string;
  canRemove: boolean;
  onChange: (patch: Partial<DiceGroup>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-background/40 p-2">
      <DieFace sides={group.sides} value={null} color={color} icon className="size-8 shrink-0" />
      <div className="flex items-center rounded-lg border">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange({ count: Math.max(1, group.count - 1) })}
          disabled={group.count <= 1}
          aria-label="Un dado in meno"
        >
          <Minus />
        </Button>
        <span className="w-6 text-center text-sm font-semibold tabular" aria-label="Numero di dadi">
          {group.count}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange({ count: Math.min(MAX_DICE_PER_GROUP, group.count + 1) })}
          disabled={group.count >= MAX_DICE_PER_GROUP}
          aria-label="Un dado in più"
        >
          <Plus />
        </Button>
      </div>
      <Select value={String(group.sides)} onValueChange={(v) => onChange({ sides: Number(v) as DieSides })}>
        <SelectTrigger className="w-20" aria-label="Tipo di dado">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DIE_SIDES.map((s) => (
            <SelectItem key={s} value={String(s)}>
              d{s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {group.sides === 20 && (
        <Select value={effectiveMode(group)} onValueChange={(v) => onChange({ mode: v as RollMode })}>
          <SelectTrigger className="w-32" aria-label="Vantaggio o svantaggio">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(MODE_LABELS) as RollMode[]).map((m) => (
              <SelectItem key={m} value={m}>
                {MODE_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Input
        list="dice-purposes"
        value={group.label}
        maxLength={30}
        placeholder="A cosa serve? (facoltativo)"
        aria-label="A cosa serve questo tiro"
        className="min-w-36 flex-1"
        onChange={(e) => onChange({ label: e.target.value })}
      />
      <ModifierInput value={group.modifier} onChange={(modifier) => onChange({ modifier })} />
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} disabled={!canRemove} aria-label="Rimuovi gruppo">
        <X />
      </Button>
    </div>
  );
}

function ModifierInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [text, setText] = useState(value ? (value > 0 ? `+${value}` : String(value)) : "");
  return (
    <Input
      inputMode="numeric"
      value={text}
      placeholder="+0"
      aria-label="Modificatore"
      title="Modificatore (es. +3 o -1)"
      className="w-16 text-center"
      onChange={(e) => {
        const next = e.target.value.replace(/[^\d+-]/g, "").slice(0, 4);
        setText(next);
        const n = parseInt(next, 10);
        onChange(Number.isFinite(n) ? Math.max(-99, Math.min(99, n)) : 0);
      }}
    />
  );
}

function RollSummary({ roll }: { roll: RollResult }) {
  const purposes = totalsByPurpose(roll);
  const showPurposes = roll.groups.some((g) => g.label) && purposes.length > 1;
  return (
    <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
      <div className="text-center sm:pr-4 sm:text-left">
        <p className="text-sm text-muted-foreground">Totale</p>
        <p className="text-5xl font-semibold tracking-tight">{roll.total}</p>
      </div>
      <div className="grid gap-2">
        <ul className="grid gap-1.5">
          {roll.groups.map((g) => {
            const nat20 = g.sides === 20 ? g.values.filter((v) => v === 20).length : 0;
            const nat1 = g.sides === 20 ? g.values.filter((v) => v === 1).length : 0;
            return (
              <li key={g.groupId} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="size-3 shrink-0 rounded-sm" style={{ background: g.color }} aria-hidden />
                <span className="font-medium">
                  {g.count}d{g.sides}
                  {g.label && ` ${g.label}`}
                </span>
                {g.mode !== "normal" && (
                  <Badge variant="outline" className="h-5 gap-0.5">
                    {g.mode === "advantage" ? <ChevronsUp className="text-[#0ca30c]" /> : <ChevronsDown className="text-[#d03b3b]" />}
                    {MODE_LABELS[g.mode]}
                  </Badge>
                )}
                <span className="text-muted-foreground tabular">
                  [
                  {g.values.map((v, i) => (
                    <span key={i}>
                      {i > 0 && ", "}
                      <span className="text-foreground">{v}</span>
                      {g.discarded?.[i] !== undefined && (
                        <span className="line-through opacity-70" title="Tiro scartato">
                          {" "}
                          {g.discarded[i]}
                        </span>
                      )}
                    </span>
                  ))}
                  ]{g.modifier !== 0 && ` ${g.modifier > 0 ? "+" : "−"} ${Math.abs(g.modifier)}`}
                </span>
                {nat20 > 0 && <Badge className="h-5 bg-[#d4a017] text-black">20 naturale!</Badge>}
                {nat1 > 0 && <Badge variant="destructive" className="h-5">1 naturale</Badge>}
                <span className="ml-auto font-semibold tabular">{g.subtotal}</span>
              </li>
            );
          })}
        </ul>
        {showPurposes && (
          <div className="flex flex-wrap gap-2 border-t pt-2">
            {purposes.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm">
                <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
                {p.label}
                <span className="font-semibold tabular">{p.total}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RollHistory({
  history,
  onRepeat,
  onClear,
}: {
  history: RollResult[];
  onRepeat: (roll: RollResult) => void;
  onClear: () => void;
}) {
  return (
    <aside className="grid content-start gap-2 lg:border-l lg:pl-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-medium">
          <History className="size-4 text-muted-foreground" /> Ultimi lanci
        </h3>
        {history.length > 0 && (
          <Button variant="ghost" size="icon-xs" onClick={onClear} aria-label="Cancella lo storico dei lanci">
            <Trash2 />
          </Button>
        )}
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun lancio ancora.</p>
      ) : (
        <ol className="grid max-h-96 gap-1 overflow-y-auto">
          {history.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onRepeat(r)}
                title="Ripeti questo lancio"
                className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="w-9 text-right text-lg font-semibold tabular">{r.total}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs">{formatFormula(r.groups)}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {new Date(r.at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
                <RotateCcw className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
