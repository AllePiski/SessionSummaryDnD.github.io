"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Pencil, Play, Trash2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { usePlayerActions, usePlayerState } from "./player";
import { characterColor } from "@/lib/colors";
import { formatLongDate, formatTimestamp } from "@/lib/format";
import { addLine, deleteLine, reassignSpeakers, setLineText } from "@/lib/repo";
import { buildScreenplay, speakerNames, type ScreenplayBlock, type ScreenplayEntry } from "@/lib/screenplay";
import type { Character, Session } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * La sceneggiatura della sessione: nome del personaggio centrato e in
 * maiuscolo, battuta sotto, come in un copione. Ogni blocco si può
 * ascoltare, correggere o riassegnare a un altro personaggio.
 */
export function ScreenplayView({
  session,
  characters,
  follow,
}: {
  session: Session;
  characters: Map<string, Character>;
  follow: boolean;
}) {
  const { currentMs, playing } = usePlayerState();
  const blocks = useMemo(() => buildScreenplay(session), [session]);
  const currentIndex = useMemo(() => {
    if (currentMs <= 0 && !playing) return -1;
    let lo = 0;
    let hi = blocks.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (blocks[mid].start <= currentMs + 1000) {
        found = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return found;
  }, [blocks, currentMs, playing]);

  const refs = useRef(new Map<string, HTMLElement>());
  const registerRef = useCallback((key: string, el: HTMLElement | null) => {
    if (el) refs.current.set(key, el);
    else refs.current.delete(key);
  }, []);
  const currentKey = currentIndex >= 0 ? blocks[currentIndex]?.key : undefined;
  useEffect(() => {
    if (!follow || !playing || !currentKey) return;
    refs.current.get(currentKey)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentKey, follow, playing]);

  const cast = session.participantIds.map((id) => characters.get(id)).filter((c): c is Character => !!c);

  return (
    <article className="font-script text-[15px] leading-relaxed print:text-[12pt]">
      <header className="mb-8 border-b border-dashed pb-6 text-center">
        <p className="text-lg font-bold tracking-[0.2em] uppercase">{session.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{formatLongDate(session.date)}</p>
        {cast.length > 0 && (
          <p className="mx-auto mt-4 max-w-xl text-xs text-muted-foreground">
            <span className="tracking-widest uppercase">Personaggi</span>
            <br />
            {cast.map((c) => c.name).join(" · ")}
          </p>
        )}
      </header>

      {blocks.length === 0 ? (
        <p className="py-10 text-center font-sans text-sm text-muted-foreground">
          Nessuna battuta registrata in questa sessione.
        </p>
      ) : (
        <div className="grid gap-1">
          {blocks.map((block, i) => (
            <BlockView
              key={block.key}
              block={block}
              session={session}
              characters={characters}
              current={i === currentIndex}
              registerRef={registerRef}
            />
          ))}
        </div>
      )}
      <p className="mt-10 text-center text-sm tracking-[0.3em] text-muted-foreground uppercase">Fine della sessione</p>
    </article>
  );
}

const BlockView = memo(function BlockView({
  block,
  session,
  characters,
  current,
  registerRef,
}: {
  block: ScreenplayBlock;
  session: Session;
  characters: Map<string, Character>;
  current: boolean;
  registerRef: (key: string, el: HTMLElement | null) => void;
}) {
  const { seek, ready } = usePlayerActions();
  const names = speakerNames(block.speakerIds, characters);
  const discussion = block.speakerIds.length > 1;

  return (
    <section
      ref={(el) => registerRef(block.key, el)}
      className={cn(
        "group relative rounded-xl px-3 py-3 transition-colors break-inside-avoid sm:px-16",
        current ? "bg-primary/8 ring-1 ring-primary/30" : "hover:bg-muted/40",
      )}
    >
      <div className="absolute top-3.5 left-3 hidden font-sans text-[11px] text-muted-foreground tabular sm:block print:block">
        {formatTimestamp(block.start)}
      </div>
      <div className="no-print absolute top-2 right-2 flex gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!ready}
              onClick={() => seek(Math.max(0, block.start - 1000), true)}
              aria-label="Ascolta da qui"
            >
              <Play />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ascolta da qui</TooltipContent>
        </Tooltip>
        <SpeakerPicker block={block} session={session} characters={characters} />
      </div>

      <header className="flex flex-col items-center gap-1 text-center">
        <span className="flex items-center gap-2">
          <span className="no-print flex -space-x-1.5">
            {block.speakerIds.slice(0, 4).map((id) => (
              <CharacterAvatar key={id} character={characters.get(id)} className="size-6 ring-2 ring-card" />
            ))}
          </span>
          <span className="font-bold tracking-wider uppercase">{names}</span>
          <span className="no-print flex gap-1" aria-hidden>
            {block.speakerIds.map((id) => (
              <span key={id} className="size-2 rounded-full" style={{ background: characterColor(characters.get(id)) }} />
            ))}
          </span>
        </span>
        {discussion && <span className="text-sm text-muted-foreground italic">(discussione)</span>}
        <span className="font-sans text-[11px] text-muted-foreground tabular sm:hidden">
          {formatTimestamp(block.start)}
        </span>
      </header>

      <div className="mx-auto mt-1.5 grid max-w-[36em] gap-1.5">
        {block.entries.map((entry) => (
          <EntryView key={entry.key} entry={entry} sessionId={session.id} />
        ))}
      </div>
    </section>
  );
});

function EntryView({ entry, sessionId }: { entry: ScreenplayEntry; sessionId: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.text);

  async function save() {
    const value = text.trim();
    if (entry.lineId) {
      if (value) await setLineText(sessionId, entry.lineId, value);
      else await deleteLine(sessionId, entry.lineId);
    } else if (value) {
      await addLine(sessionId, { t: entry.t, text: value, speakerIds: entry.speakerIds });
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="no-print grid gap-2 font-sans">
        <Textarea
          value={text}
          autoFocus
          rows={Math.min(8, Math.max(2, Math.ceil(text.length / 60)))}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setText(entry.text);
              setEditing(false);
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void save();
          }}
          placeholder="Scrivi la battuta…"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => void save()}>
            <Check /> Salva
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setText(entry.text);
              setEditing(false);
            }}
          >
            Annulla
          </Button>
          {entry.lineId && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-destructive"
              onClick={() => {
                void deleteLine(sessionId, entry.lineId!);
                toast.success("Battuta eliminata.");
              }}
            >
              <Trash2 /> Elimina
            </Button>
          )}
          <span className="hidden text-xs text-muted-foreground sm:inline">Ctrl/⌘ + Invio per salvare</span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setText(entry.text);
        setEditing(true);
      }}
      className="group/entry relative w-full cursor-text rounded-md px-1 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
      title="Clicca per modificare"
    >
      {entry.text ? (
        <span>{entry.text}</span>
      ) : (
        <span className="text-muted-foreground italic">(nessun testo: ascolta e clicca per scrivere la battuta)</span>
      )}
      <Pencil className="no-print absolute top-1 -right-5 size-3.5 text-muted-foreground opacity-0 group-hover/entry:opacity-100" />
    </button>
  );
}

function SpeakerPicker({
  block,
  session,
  characters,
}: {
  block: ScreenplayBlock;
  session: Session;
  characters: Map<string, Character>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(block.speakerIds);
  const options = useMemo(() => {
    const inSession = session.participantIds.map((id) => characters.get(id)).filter((c): c is Character => !!c);
    const others = [...characters.values()].filter((c) => !c.archived && !session.participantIds.includes(c.id));
    return [...inSession, ...others];
  }, [session.participantIds, characters]);

  async function apply() {
    if (selected.length === 0) return;
    await reassignSpeakers(session.id, { start: block.start, end: block.end }, block.speakerIds, selected);
    setOpen(false);
    toast.success("Battute riassegnate.");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setSelected(block.speakerIds);
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Cambia chi parla">
              <UsersRound />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Cambia chi parla</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-64 p-2 font-sans">
        <p className="px-2 pt-1 pb-2 text-xs text-muted-foreground">Chi sta parlando in questo blocco?</p>
        <div className="grid max-h-64 gap-0.5 overflow-y-auto">
          {options.map((c) => {
            const checked = selected.includes(c.id);
            return (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) =>
                    setSelected((s) => (v ? [...s, c.id] : s.filter((x) => x !== c.id)))
                  }
                />
                <CharacterAvatar character={c} className="size-6" />
                <span className="truncate">{c.name}</span>
              </label>
            );
          })}
        </div>
        <Button size="sm" className="mt-2 w-full" disabled={selected.length === 0} onClick={() => void apply()}>
          Applica
        </Button>
      </PopoverContent>
    </Popover>
  );
}
