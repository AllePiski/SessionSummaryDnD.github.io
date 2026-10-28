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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { CharacterFields } from "@/components/characters/character-fields";
import { EMPTY_DRAFT } from "@/components/characters/character-dialog";
import { useCharacters } from "@/hooks/use-data";
import { raceLabel } from "@/lib/races";
import { addCharacter, type CharacterDraft } from "@/lib/repo";

/** Aggiunge al volo un personaggio comparso durante la sessione. */
export function AddParticipantDialog({
  open,
  onOpenChange,
  excludeIds,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excludeIds: string[];
  onAdd: (characterId: string, speakNow: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {open && (
          <Body
            excludeIds={excludeIds}
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
  excludeIds,
  onAdd,
  onCancel,
}: {
  excludeIds: string[];
  onAdd: (characterId: string, speakNow: boolean) => void;
  onCancel: () => void;
}) {
  const characters = useCharacters();
  const known = (characters ?? []).filter((c) => !excludeIds.includes(c.id));
  const [draft, setDraft] = useState<CharacterDraft>({ ...EMPTY_DRAFT, raceId: "umano" });
  const [kind, setKind] = useState<"npc" | "pc">("npc");
  const [speakNow, setSpeakNow] = useState(true);
  const [saving, setSaving] = useState(false);

  async function createAndAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) {
      toast.error("Dai un nome al personaggio.");
      return;
    }
    setSaving(true);
    try {
      const created = await addCharacter(draft, kind);
      toast.success(`${created.name} entra in scena!`);
      onAdd(created.id, speakNow);
    } catch {
      toast.error("Non sono riuscito ad aggiungere il personaggio.");
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Chi entra in scena?</DialogTitle>
        <DialogDescription>La registrazione continua mentre aggiungi il personaggio.</DialogDescription>
      </DialogHeader>
      <Tabs defaultValue="new" className="gap-4">
        <TabsList className="w-full">
          <TabsTrigger value="new">Nuovo personaggio</TabsTrigger>
          <TabsTrigger value="known" disabled={known.length === 0}>
            Già incontrati {known.length > 0 && `(${known.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <form onSubmit={createAndAdd} className="grid gap-5">
            <ToggleGroup
              type="single"
              variant="outline"
              value={kind}
              onValueChange={(v) => v && setKind(v as "npc" | "pc")}
              className="w-fit"
            >
              <ToggleGroupItem value="npc">PNG / comparsa</ToggleGroupItem>
              <ToggleGroupItem value="pc">Nuovo membro del party</ToggleGroupItem>
            </ToggleGroup>
            <CharacterFields
              value={draft}
              onChange={setDraft}
              namePlaceholder="Es. Il locandiere, Strahd…"
              showPlayer={kind === "pc"}
              showClass={kind === "pc"}
              autoFocus
            />
            <div className="flex items-center gap-3">
              <Switch id="speak-now" checked={speakNow} onCheckedChange={setSpeakNow} />
              <Label htmlFor="speak-now" className="font-normal">
                Selezionalo subito come personaggio che parla
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Annulla
              </Button>
              <Button type="submit" disabled={saving}>
                Aggiungi alla sessione
              </Button>
            </DialogFooter>
          </form>
        </TabsContent>

        <TabsContent value="known">
          <div className="grid max-h-[55vh] gap-1 overflow-y-auto">
            {known.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onAdd(c.id, speakNow)}
                className="flex items-center gap-3 rounded-lg p-2 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CharacterAvatar character={c} className="size-10" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {c.kind === "pc" ? "Party" : c.kind === "npc" ? "PNG" : "Master"} ·{" "}
                    {raceLabel(c.raceId, c.gender)}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Switch id="speak-now-known" checked={speakNow} onCheckedChange={setSpeakNow} />
            <Label htmlFor="speak-now-known" className="font-normal">
              Selezionalo subito come personaggio che parla
            </Label>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
