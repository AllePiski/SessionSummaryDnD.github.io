"use client";

import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { AvatarPickerDialog } from "./avatar-picker";
import { fileToAvatarDataUrl } from "@/lib/image";
import { CLASSES, MASTER_AVATAR, raceLabel } from "@/lib/races";
import type { CharacterDraft } from "@/lib/repo";
import { cn } from "@/lib/utils";

const NO_CLASS = "__none__";

export function CharacterFields({
  value,
  onChange,
  namePlaceholder = "Nome del personaggio",
  showPlayer = false,
  showClass = false,
  allowMasterAvatar = false,
  autoFocus = false,
  className,
}: {
  value: CharacterDraft;
  /** riceve un updater: le modifiche asincrone (foto) non sovrascrivono quanto digitato nel frattempo */
  onChange: (update: (prev: CharacterDraft) => CharacterDraft) => void;
  namePlaceholder?: string;
  showPlayer?: boolean;
  showClass?: boolean;
  allowMasterAvatar?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const id = useId();
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const photo = await fileToAvatarDataUrl(file);
      onChange((v) => ({ ...v, photo }));
    } catch {
      toast.error("Non riesco a leggere questa immagine. Prova con un JPG o PNG.");
    }
  }

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row", className)}>
      <div className="flex flex-row items-center gap-3 sm:flex-col sm:gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="group relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring"
          aria-label="Cambia avatar"
        >
          <CharacterAvatar character={value} className="size-20 ring-1 ring-border sm:size-24" />
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/55 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Pencil className="size-4" />
          </span>
        </button>
        <div className="flex items-center gap-1">
          <Button type="button" size="xs" variant="ghost" onClick={() => fileRef.current?.click()}>
            <ImagePlus /> {value.photo ? "Cambia foto" : "Foto"}
          </Button>
          {value.photo && (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label="Rimuovi foto"
              onClick={() => onChange((v) => ({ ...v, photo: undefined }))}
            >
              <X />
            </Button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>

      <div className="grid flex-1 content-start gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-name`}>Nome</Label>
          <Input
            id={`${id}-name`}
            value={value.name}
            placeholder={namePlaceholder}
            autoFocus={autoFocus}
            maxLength={60}
            onChange={(e) => onChange((v) => ({ ...v, name: e.target.value }))}
          />
        </div>
        {showPlayer && (
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-player`}>
              Giocatore <span className="font-normal text-muted-foreground">(facoltativo)</span>
            </Label>
            <Input
              id={`${id}-player`}
              value={value.playerName ?? ""}
              placeholder="Chi lo interpreta"
              maxLength={60}
              onChange={(e) => onChange((v) => ({ ...v, playerName: e.target.value }))}
            />
          </div>
        )}
        <div className={cn("grid gap-3", showClass && "sm:grid-cols-2")}>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-race`}>{value.raceId === MASTER_AVATAR ? "Avatar" : "Razza"}</Label>
            <Button
              id={`${id}-race`}
              type="button"
              variant="outline"
              className="h-8 justify-between"
              onClick={() => setPickerOpen(true)}
            >
              {raceLabel(value.raceId, value.gender)}
              <Pencil className="text-muted-foreground" />
            </Button>
          </div>
          {showClass && (
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-class`}>Classe</Label>
              <Select
                value={value.className || NO_CLASS}
                onValueChange={(choice) => onChange((v) => ({ ...v, className: choice === NO_CLASS ? undefined : choice }))}
              >
                <SelectTrigger id={`${id}-class`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CLASS}>Nessuna</SelectItem>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <AvatarPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        raceId={value.raceId}
        gender={value.gender}
        allowMaster={allowMasterAvatar}
        onSelect={(raceId, gender) => onChange((v) => ({ ...v, raceId, gender }))}
      />
    </div>
  );
}
