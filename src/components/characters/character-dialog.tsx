"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CharacterFields } from "./character-fields";
import { addCharacter, updateCharacter, type CharacterDraft } from "@/lib/repo";
import type { Character, CharacterKind } from "@/lib/types";

export const EMPTY_DRAFT: CharacterDraft = { name: "", raceId: "umano", gender: "m" };

function toDraft(c: Character): CharacterDraft {
  return {
    name: c.name,
    playerName: c.playerName,
    raceId: c.raceId,
    gender: c.gender,
    className: c.className,
    photo: c.photo,
  };
}

/**
 * Crea o modifica un personaggio. Per i nuovi si sceglie se è del party (PG)
 * o una comparsa (PNG).
 */
export function CharacterDialog({
  open,
  onOpenChange,
  character,
  defaultKind = "pc",
  onSaved,
  title,
  description,
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character?: Character;
  defaultKind?: Exclude<CharacterKind, "master">;
  onSaved?: (character: Character) => void;
  title?: string;
  description?: string;
  submitLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {open && (
          <CharacterDialogBody
            character={character}
            defaultKind={defaultKind}
            title={title}
            description={description}
            submitLabel={submitLabel}
            onDone={(saved) => {
              onOpenChange(false);
              if (saved) onSaved?.(saved);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CharacterDialogBody({
  character,
  defaultKind,
  title,
  description,
  submitLabel,
  onDone,
}: {
  character?: Character;
  defaultKind: Exclude<CharacterKind, "master">;
  title?: string;
  description?: string;
  submitLabel?: string;
  onDone: (saved: Character | null) => void;
}) {
  const [draft, setDraft] = useState<CharacterDraft>(character ? toDraft(character) : EMPTY_DRAFT);
  const [kind, setKind] = useState<CharacterKind>(character?.kind ?? defaultKind);
  const [saving, setSaving] = useState(false);
  const isMaster = kind === "master";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const name = draft.name.trim() || (isMaster ? "Master" : "");
    if (!name) {
      toast.error("Dai un nome al personaggio.");
      return;
    }
    setSaving(true);
    try {
      if (character) {
        await updateCharacter(character.id, { ...draft, name }, kind);
        onDone({ ...character, ...draft, name, kind });
      } else {
        onDone(await addCharacter({ ...draft, name }, kind));
      }
    } catch {
      toast.error("Salvataggio non riuscito.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{title ?? (character ? `Modifica ${character.name}` : "Nuovo personaggio")}</DialogTitle>
        <DialogDescription>
          {description ??
            (isMaster
              ? "Il nome e l'immagine con cui il master compare nelle sessioni."
              : "Scegli un avatar per razza oppure carica una foto.")}
        </DialogDescription>
      </DialogHeader>

      {!isMaster && (
        <div className="grid gap-1.5">
          <Label>Tipo</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={kind}
            onValueChange={(v) => v && setKind(v as CharacterKind)}
            className="w-fit"
          >
            <ToggleGroupItem value="pc">Personaggio del party</ToggleGroupItem>
            <ToggleGroupItem value="npc">PNG / comparsa</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      <CharacterFields
        value={draft}
        onChange={setDraft}
        showPlayer={kind === "pc"}
        showClass={kind === "pc"}
        allowMasterAvatar={isMaster}
        namePlaceholder={isMaster ? "Master" : "Es. Elenwë, Thorin, il mercante…"}
        autoFocus={!character}
      />

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => onDone(null)}>
          Annulla
        </Button>
        <Button type="submit" disabled={saving}>
          {submitLabel ?? (character ? "Salva modifiche" : "Aggiungi")}
        </Button>
      </DialogFooter>
    </form>
  );
}
