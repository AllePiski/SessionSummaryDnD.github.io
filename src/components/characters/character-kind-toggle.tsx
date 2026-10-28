"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type NewCharacterKind = "pc" | "npc";

/** Scelta tra membro del party e PNG, uguale in tutti i dialog. */
export function CharacterKindToggle({
  value,
  onChange,
}: {
  value: NewCharacterKind;
  onChange: (kind: NewCharacterKind) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(v) => v && onChange(v as NewCharacterKind)}
      className="w-fit"
      aria-label="Tipo di personaggio"
    >
      <ToggleGroupItem value="pc">Del party</ToggleGroupItem>
      <ToggleGroupItem value="npc">PNG</ToggleGroupItem>
    </ToggleGroup>
  );
}
