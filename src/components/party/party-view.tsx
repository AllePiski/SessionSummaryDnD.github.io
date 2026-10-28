"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Crown, Pencil, Plus, Trash2, UserRoundPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { CharacterDialog } from "@/components/characters/character-dialog";
import { PageHeader, PageLoading } from "@/components/page-header";
import { PartyWizard } from "./party-wizard";
import { useCharacters } from "@/hooks/use-data";
import { characterColor } from "@/lib/colors";
import { raceLabel } from "@/lib/races";
import { removeCharacter } from "@/lib/repo";
import type { Character } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PartyView() {
  const characters = useCharacters();
  const [editing, setEditing] = useState<Character | null>(null);
  const [creating, setCreating] = useState<"pc" | "npc" | null>(null);
  const [deleting, setDeleting] = useState<Character | null>(null);

  if (characters === undefined) return <PageLoading />;

  const master = characters.find((c) => c.kind === "master");
  const pcs = characters.filter((c) => c.kind === "pc");
  const npcs = characters.filter((c) => c.kind === "npc");

  if (pcs.length === 0) return <PartyWizard existingMaster={master} />;

  async function confirmDelete() {
    if (!deleting) return;
    await removeCharacter(deleting.id);
    toast.success(`${deleting.name} è stato rimosso.`);
    setDeleting(null);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Il party"
        description="I personaggi che partecipano alle sessioni. I PNG aggiunti durante il gioco finiscono tra i personaggi incontrati."
        actions={
          <Button onClick={() => setCreating("pc")}>
            <UserRoundPlus /> Aggiungi personaggio
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {master && <CharacterCard character={master} onEdit={() => setEditing(master)} />}
        {pcs.map((c) => (
          <CharacterCard key={c.id} character={c} onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} />
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Personaggi incontrati</h3>
            <p className="text-sm text-muted-foreground">PNG e comparse: riutilizzabili nelle sessioni successive.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCreating("npc")}>
            <Plus /> Nuovo PNG
          </Button>
        </div>
        {npcs.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nessun PNG per ora. Puoi aggiungerli qui o al volo durante una registrazione.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {npcs.map((c) => (
              <CharacterCard key={c.id} character={c} compact onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} />
            ))}
          </div>
        )}
      </section>

      <CharacterDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} character={editing ?? undefined} />
      <CharacterDialog
        open={!!creating}
        onOpenChange={(o) => !o && setCreating(null)}
        defaultKind={creating ?? "pc"}
        onSaved={(c) => toast.success(`${c.name} si unisce all'avventura!`)}
      />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rimuovere {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se compare in sessioni già registrate verrà solo nascosto, così le sceneggiature restano intatte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
              Rimuovi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CharacterCard({
  character,
  compact,
  onEdit,
  onDelete,
}: {
  character: Character;
  compact?: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const isMaster = character.kind === "master";
  const subtitle = isMaster
    ? "Master"
    : [raceLabel(character.raceId, character.gender), character.className].filter(Boolean).join(" · ");
  return (
    <Card className={cn("flex-row items-center gap-4 px-4", compact ? "py-3" : "py-5", isMaster && "ring-primary/35")}>
      <div className="relative">
        <CharacterAvatar character={character} className={compact ? "size-12" : "size-20"} />
        <span
          className="absolute right-0 bottom-0 size-3.5 rounded-full ring-3 ring-card"
          style={{ background: characterColor(character) }}
          aria-hidden
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {isMaster && <Crown className="size-4 shrink-0 text-primary" />}
          <h3 className={cn("truncate font-semibold", compact ? "text-sm" : "text-base")}>{character.name}</h3>
        </div>
        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        {!compact && character.playerName && (
          <p className="truncate text-xs text-muted-foreground">Giocato da {character.playerName}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Modifica ${character.name}`}>
          <Pencil />
        </Button>
        {onDelete && (
          <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label={`Rimuovi ${character.name}`}>
            <Trash2 />
          </Button>
        )}
      </div>
    </Card>
  );
}
