"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RaceAvatar } from "@/components/avatars/race-avatar";
import { MASTER_AVATAR, RACES } from "@/lib/races";
import type { Gender } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AvatarPickerDialog({
  open,
  onOpenChange,
  raceId,
  gender,
  allowMaster,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  raceId: string;
  gender: Gender;
  allowMaster?: boolean;
  onSelect: (raceId: string, gender: Gender) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scegli l&apos;avatar</DialogTitle>
          <DialogDescription>Venti razze, in versione maschile e femminile. Puoi sempre caricare una foto.</DialogDescription>
        </DialogHeader>
        {/* montato solo da aperto: a ogni apertura riparte dal genere attuale */}
        {open && (
          <PickerGrid
            raceId={raceId}
            initialGender={gender}
            allowMaster={allowMaster}
            onSelect={(r, g) => {
              onSelect(r, g);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PickerGrid({
  raceId,
  initialGender,
  allowMaster,
  onSelect,
}: {
  raceId: string;
  initialGender: Gender;
  allowMaster?: boolean;
  onSelect: (raceId: string, gender: Gender) => void;
}) {
  const [gender, setGender] = useState<Gender>(initialGender);
  const options = [
    ...(allowMaster ? [{ id: MASTER_AVATAR, label: "Master" }] : []),
    ...RACES.map((r) => ({ id: r.id as string, label: r[gender] })),
  ];

  return (
    <div className="grid gap-4">
      <ToggleGroup
        type="single"
        variant="outline"
        value={gender}
        onValueChange={(v) => v && setGender(v as Gender)}
        className="w-fit"
      >
        <ToggleGroupItem value="m">Maschile</ToggleGroupItem>
        <ToggleGroupItem value="f">Femminile</ToggleGroupItem>
      </ToggleGroup>
      <div className="-mx-2 grid max-h-[58vh] grid-cols-3 gap-1 overflow-y-auto px-2 py-1 sm:grid-cols-5">
        {options.map((o) => {
          const selected = o.id === raceId && (o.id === MASTER_AVATAR || gender === initialGender);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect(o.id, gender)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl p-2 text-xs transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                selected && "bg-accent ring-2 ring-primary",
              )}
            >
              <RaceAvatar raceId={o.id} gender={gender} className="size-16 rounded-full sm:size-[72px]" />
              <span className="text-center leading-tight">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
