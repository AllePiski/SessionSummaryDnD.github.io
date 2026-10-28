"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Palette, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { CharacterFields } from "@/components/characters/character-fields";
import { CharacterKindToggle, type NewCharacterKind } from "@/components/characters/character-kind-toggle";
import { useCharacters } from "@/hooks/use-data";
import { characterSubtitle } from "@/lib/characters";
import { pickUnusedAvatar } from "@/lib/races";
import { addCharacter, type CharacterDraft } from "@/lib/repo";
import type { Character } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Aggiunge al volo chi entra in scena: si scrive un nome, si sceglie tra
 * assenti del party e PNG già incontrati, oppure Invio crea un nuovo PNG
 * con un avatar non ancora usato.
 */
export function AddParticipantDialog({
  open,
  onOpenChange,
  participantIds,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantIds: string[];
  onAdd: (characterId: string, speakNow: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {open && (
          <Body
            participantIds={participantIds}
            onAdd={(id, speakNow) => {
              onAdd(id, speakNow);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  participantIds,
  onAdd,
  onCancel,
}: {
  participantIds: string[];
  onAdd: (characterId: string, speakNow: boolean) => void;
  onCancel: () => void;
}) {
  const listId = useId();
  const characters = useCharacters() ?? [];
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [speakNow, setSpeakNow] = useState(true);
  const [custom, setCustom] = useState<{ draft: CharacterDraft; kind: NewCharacterKind } | null>(null);
  const [saving, setSaving] = useState(false);

  const inSession = new Set(participantIds);
  const present = characters.filter((c) => inSession.has(c.id));
  const q = query.trim().toLowerCase();
  const matches = (c: Character) => !inSession.has(c.id) && (!q || c.name.toLowerCase().includes(q));
  const absentParty = characters.filter((c) => c.kind === "pc" && matches(c));
  const knownNpcs = characters.filter((c) => c.kind === "npc" && matches(c));
  const options = [...absentParty, ...knownNpcs];
  const canCreate = q.length > 0 && !characters.some((c) => c.name.trim().toLowerCase() === q);
  const rowCount = options.length + (canCreate ? 1 : 0);

  async function create(draft: CharacterDraft, kind: NewCharacterKind) {
    const name = draft.name.trim();
    if (!name) {
      toast.error("Scrivi il nome del personaggio.");
      return;
    }
    setSaving(true);
    try {
      const created = await addCharacter({ ...draft, name }, kind);
      toast.success(`${created.name} entra in scena!`);
      onAdd(created.id, speakNow);
    } catch {
      toast.error("Non sono riuscito ad aggiungere il personaggio.");
      setSaving(false);
    }
  }

  const quickDraft = (): CharacterDraft => ({ name: query.trim(), ...pickUnusedAvatar(present) });

  function choose(index: number) {
    if (index < options.length) onAdd(options[index].id, speakNow);
    else if (canCreate) void create(quickDraft(), "npc");
  }

  const speakSwitch = (
    <div className="flex items-center gap-3">
      <Switch id="speak-now" checked={speakNow} onCheckedChange={setSpeakNow} />
      <Label htmlFor="speak-now" className="font-normal">
        Selezionalo subito come personaggio che parla
      </Label>
    </div>
  );

  if (custom) {
    return (
      <form
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          void create(custom.draft, custom.kind);
        }}
      >
        <DialogHeader>
          <DialogTitle>Nuovo personaggio</DialogTitle>
          <DialogDescription>La registrazione continua mentre lo prepari.</DialogDescription>
        </DialogHeader>
        <CharacterKindToggle value={custom.kind} onChange={(kind) => setCustom({ ...custom, kind })} />
        <CharacterFields
          value={custom.draft}
          onChange={(update) => setCustom((c) => (c ? { ...c, draft: update(c.draft) } : c))}
          namePlaceholder="Es. Il locandiere, Strahd…"
          showPlayer={custom.kind === "pc"}
          showClass={custom.kind === "pc"}
          autoFocus={!custom.draft.name}
        />
        {speakSwitch}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setCustom(null)}>
            Indietro
          </Button>
          <Button type="submit" disabled={saving}>
            Aggiungi alla sessione
          </Button>
        </DialogFooter>
      </form>
    );
  }

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Chi entra in scena?</DialogTitle>
        <DialogDescription>
          Scrivi un nome: puoi scegliere chi hai già incontrato oppure premere Invio per creare un nuovo PNG.
        </DialogDescription>
      </DialogHeader>
      <Input
        autoFocus
        value={query}
        placeholder="Scrivi un nome…"
        aria-label="Nome del personaggio"
        role="combobox"
        aria-expanded={rowCount > 0}
        aria-controls={listId}
        aria-activedescendant={rowCount > 0 ? `${listId}-${highlight}` : undefined}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(rowCount - 1, h + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(0, h - 1));
          } else if (e.key === "Enter" && rowCount > 0) {
            e.preventDefault();
            choose(Math.min(highlight, rowCount - 1));
          }
        }}
      />

      <ul id={listId} role="listbox" aria-label="Personaggi" className="-mx-1 grid max-h-[45vh] gap-0.5 overflow-y-auto px-1">
        {options.map((c, i) => (
          <OptionRow
            key={c.id}
            id={`${listId}-${i}`}
            heading={
              i === 0 && absentParty.length > 0
                ? "Dal party (assenti oggi)"
                : i === absentParty.length
                  ? "PNG già incontrati"
                  : undefined
            }
            highlighted={i === highlight}
            onHover={() => setHighlight(i)}
            onChoose={() => choose(i)}
          >
            <CharacterAvatar character={c} showColor ringClassName="ring-popover" className="size-9" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{c.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{characterSubtitle(c, { withPlayer: true })}</span>
            </span>
          </OptionRow>
        ))}
        {canCreate && (
          <OptionRow
            id={`${listId}-${options.length}`}
            highlighted={highlight === options.length}
            onHover={() => setHighlight(options.length)}
            onChoose={() => choose(options.length)}
          >
            <span className="grid size-9 place-items-center rounded-full border border-dashed">
              <Plus className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">Crea il PNG «{query.trim()}»</span>
              <span className="block text-xs text-muted-foreground">Avatar e colore li scelgo io · Invio</span>
            </span>
          </OptionRow>
        )}
        {rowCount === 0 && (
          <li className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            {q ? "Esiste già un personaggio con questo nome nella sessione." : "Scrivi il nome di chi entra in scena."}
          </li>
        )}
      </ul>

      {speakSwitch}
      <DialogFooter className="sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCustom({ draft: quickDraft(), kind: "npc" })}
          disabled={saving}
        >
          <Palette /> Personalizza o aggiungi al party
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annulla
        </Button>
      </DialogFooter>
    </div>
  );
}

function OptionRow({
  id,
  heading,
  highlighted,
  onHover,
  onChoose,
  children,
}: {
  id: string;
  heading?: string;
  highlighted: boolean;
  onHover: () => void;
  onChoose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {heading && (
        <li role="presentation" className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {heading}
        </li>
      )}
      <li
        id={id}
        role="option"
        aria-selected={highlighted}
        onMouseMove={onHover}
        onClick={onChoose}
        className={cn("flex cursor-pointer items-center gap-3 rounded-lg p-2", highlighted && "bg-accent")}
      >
        {children}
      </li>
    </>
  );
}
