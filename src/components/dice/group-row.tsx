"use client";

import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DieFace } from "./die-face";
import {
  DIE_SIDES,
  MAX_DICE_PER_GROUP,
  MODE_LABELS,
  effectiveMode,
  type DiceGroup,
  type DieSides,
  type RollMode,
} from "@/lib/dice";

/** Una riga del lancio: quantità, tipo di dado, vantaggio (solo d20), scopo e modificatore. */
export function GroupRow({
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

/** Campo del modificatore: accetta "+3", "-1"… (testo libero mentre si scrive). */
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
