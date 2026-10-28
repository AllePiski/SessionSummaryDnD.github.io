"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarStack } from "@/components/avatars/character-avatar";
import { DatePicker } from "@/components/date-picker";
import { SessionActions } from "./session-actions";
import { updateSessionInfo } from "@/lib/repo";
import type { Character, Session } from "@/lib/types";

/** Titolo modificabile, data di gioco, partecipanti e azioni della sessione. */
export function SessionHeader({
  session,
  characters,
  cast,
  canDownload,
  onDownload,
}: {
  session: Session;
  characters: Map<string, Character>;
  cast: Character[];
  canDownload: boolean;
  onDownload: () => void;
}) {
  return (
    <div className="no-print flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-[min(100%,18rem)] flex-1">
        <EditableTitle session={session} />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <DatePicker value={session.date} onChange={(date) => void updateSessionInfo(session.id, { date })} className="h-8" />
          {session.status === "interrupted" && <Badge variant="secondary">Recuperata dopo un&apos;interruzione</Badge>}
          <AvatarStack characters={cast} max={7} className="ml-1" />
        </div>
      </div>
      <SessionActions session={session} characters={characters} canDownload={canDownload} onDownload={onDownload} />
    </div>
  );
}

function EditableTitle({ session }: { session: Session }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(session.title);
  const [saving, setSaving] = useState(false);

  async function save() {
    const title = value.trim();
    if (saving) return;
    setSaving(true);
    try {
      if (title && title !== session.title) await updateSessionInfo(session.id, { title });
      setEditing(false);
    } catch {
      toast.error("Non sono riuscito a salvare il titolo.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <form
        className="flex max-w-xl items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Input
          value={value}
          autoFocus
          maxLength={80}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          className="h-10 text-lg"
          aria-label="Titolo della sessione"
        />
        <Button type="submit" size="icon" disabled={saving} aria-label="Salva titolo">
          <Check />
        </Button>
      </form>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        setValue(session.title);
        setEditing(true);
      }}
      aria-label={`Rinomina: ${session.title}`}
      className="group flex max-w-full items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <h2 className="truncate font-display text-2xl font-bold tracking-wide md:text-3xl">{session.title}</h2>
      <Pencil className="size-4 shrink-0 text-muted-foreground opacity-60 transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-visible:opacity-100" />
    </button>
  );
}
