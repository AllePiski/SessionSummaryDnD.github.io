"use client";

import { createContext, memo, use, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, PenLine, Play, Trash2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { usePlayerActions, usePlayerState } from "./player";
import { characterColor } from "@/lib/colors";
import { formatClock, formatDuration, formatLongDate, sameSpeakers } from "@/lib/format";
import {
  addLine,
  deleteLine,
  reassignSpeakers,
  restoreSessionContent,
  setLineText,
  type SessionContent,
} from "@/lib/repo";
import { buildScreenplay, speakerNames, type ScreenplayBlock, type ScreenplayEntry } from "@/lib/screenplay";
import type { Character, Session } from "@/lib/types";
import { cn } from "@/lib/utils";

/** La sessione corrente, letta solo dai popover aperti (così i blocchi non si ridisegnano a ogni modifica). */
const SessionContext = createContext<Session | null>(null);

interface BlockCallbacks {
  registerRef: (key: string, el: HTMLElement | null) => void;
  /** apre l'editor di una battuta (null = chiude); `listen` fa partire l'audio da lì */
  edit: (entry: ScreenplayEntry | null, listen?: boolean) => void;
  /** dopo un salvataggio con Invio: passa al prossimo turno da trascrivere */
  advance: (fromKey: string) => void;
}

/**
 * La sceneggiatura della sessione: nome del personaggio centrato e in
 * maiuscolo, battuta sotto, come in un copione. Ogni blocco si può
 * ascoltare, correggere o riassegnare; i turni senza testo si trascrivono
 * uno dopo l'altro con Invio.
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
  const { seek } = usePlayerActions();
  const blocks = useMemo(() => buildScreenplay(session), [session]);
  const entries = useMemo(() => blocks.flatMap((b) => b.entries), [blocks]);
  const written = entries.filter((e) => e.text).length;
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

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
  const callbacks = useMemo<BlockCallbacks>(
    () => ({
      registerRef: (key, el) => {
        if (el) refs.current.set(key, el);
        else refs.current.delete(key);
      },
      edit: (entry, listen = false) => {
        setEditingKey(entry?.key ?? null);
        if (entry && listen) seek(Math.max(0, entry.t - 1000), true);
      },
      advance: (fromKey) => {
        const list = entriesRef.current;
        const from = list.findIndex((e) => e.key === fromKey);
        const next = list.slice(from + 1).find((e) => !e.text);
        setEditingKey(next?.key ?? null);
        if (next) seek(Math.max(0, next.t - 1000), true);
      },
    }),
    [seek],
  );

  // "Segui l'audio" si ferma mentre si scrive, per non portare via il campo di testo
  const currentKey = currentIndex >= 0 ? blocks[currentIndex]?.key : undefined;
  useEffect(() => {
    if (!follow || !playing || !currentKey || editingKey) return;
    refs.current.get(currentKey)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentKey, follow, playing, editingKey]);

  const cast = session.participantIds.map((id) => characters.get(id)).filter((c): c is Character => !!c);
  const firstTodo = entries.find((e) => !e.text);

  return (
    <SessionContext value={session}>
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

        {entries.length > 0 && written < entries.length && (
          <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 font-sans text-sm">
            <span>
              <span className="font-semibold">{written}</span> di {entries.length} turni scritti
              <span className="hidden text-muted-foreground sm:inline"> · Invio salva e passa al successivo</span>
            </span>
            {firstTodo && (
              <Button size="sm" variant="outline" onClick={() => callbacks.edit(firstTodo, true)}>
                <PenLine /> Trascrivi i turni mancanti
              </Button>
            )}
          </div>
        )}

        {blocks.length === 0 ? (
          <p className="py-10 text-center font-sans text-sm text-muted-foreground">
            Nessun turno di parola registrato in questa sessione.
          </p>
        ) : (
          <div className="grid gap-1">
            {blocks.map((block, i) => (
              <BlockView
                key={block.key}
                block={block}
                sessionId={session.id}
                characters={characters}
                current={i === currentIndex}
                editingKey={editingKey && block.entries.some((e) => e.key === editingKey) ? editingKey : null}
                callbacks={callbacks}
              />
            ))}
          </div>
        )}
        <p className="mt-10 text-center text-sm tracking-[0.3em] text-muted-foreground uppercase">Fine della sessione</p>
      </article>
    </SessionContext>
  );
}

function sameBlock(a: ScreenplayBlock, b: ScreenplayBlock) {
  return (
    a === b ||
    (a.key === b.key &&
      a.start === b.start &&
      a.end === b.end &&
      a.speakerIds.join() === b.speakerIds.join() &&
      a.entries.length === b.entries.length &&
      a.entries.every((e, i) => e.key === b.entries[i].key && e.text === b.entries[i].text))
  );
}

interface BlockViewProps {
  block: ScreenplayBlock;
  sessionId: string;
  characters: Map<string, Character>;
  current: boolean;
  editingKey: string | null;
  callbacks: BlockCallbacks;
}

/** Un blocco del copione; si ridisegna solo se cambia davvero (non a ogni modifica della sessione). */
const BlockView = memo(
  function BlockView({ block, sessionId, characters, current, editingKey, callbacks }: BlockViewProps) {
    const { seek, ready } = usePlayerActions();
    const discussion = block.speakerIds.length > 1;

    return (
      <section
        ref={(el) => callbacks.registerRef(block.key, el)}
        className={cn(
          "group relative rounded-xl px-3 py-3 transition-colors break-inside-avoid sm:px-16",
          "[contain-intrinsic-size:auto_7rem] [content-visibility:auto] print:[content-visibility:visible]",
          current ? "bg-primary/8 ring-1 ring-primary/30" : "hover:bg-muted/40",
        )}
      >
        <div className="absolute top-3.5 left-3 hidden font-sans text-[11px] text-muted-foreground tabular sm:block print:block">
          {formatClock(block.start)}
        </div>
        <div className="no-print absolute top-2 right-2 flex gap-0.5 transition-opacity pointer-fine:opacity-0 pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!ready}
            onClick={() => seek(Math.max(0, block.start - 1000), true)}
            aria-label="Ascolta da qui"
            title="Ascolta da qui"
          >
            <Play />
          </Button>
          <SpeakerPicker block={block} sessionId={sessionId} characters={characters} />
        </div>

        <header className="flex flex-col items-center gap-1 text-center">
          <span className="flex items-center gap-2">
            <span className="no-print flex -space-x-1.5">
              {block.speakerIds.slice(0, 4).map((id) => (
                <CharacterAvatar key={id} character={characters.get(id)} className="size-6 ring-2 ring-card" />
              ))}
            </span>
            <span className="font-bold tracking-wider uppercase">{speakerNames(block.speakerIds, characters)}</span>
            <span className="no-print flex gap-1" aria-hidden>
              {block.speakerIds.map((id) => (
                <span key={id} className="size-2 rounded-full" style={{ background: characterColor(characters.get(id)) }} />
              ))}
            </span>
          </span>
          {discussion && <span className="text-sm text-muted-foreground italic">(discussione)</span>}
          <span className="font-sans text-[11px] text-muted-foreground tabular sm:hidden">{formatClock(block.start)}</span>
        </header>

        <div className="mx-auto mt-1.5 grid max-w-[36em] gap-1.5">
          {block.entries.map((entry) =>
            entry.key === editingKey ? (
              <EntryEditor key={entry.key} entry={entry} sessionId={sessionId} callbacks={callbacks} />
            ) : (
              <EntryText key={entry.key} entry={entry} callbacks={callbacks} />
            ),
          )}
        </div>
      </section>
    );
  },
  (p, n) =>
    p.current === n.current &&
    p.editingKey === n.editingKey &&
    p.sessionId === n.sessionId &&
    p.characters === n.characters &&
    p.callbacks === n.callbacks &&
    sameBlock(p.block, n.block),
);

function EntryText({ entry, callbacks }: { entry: ScreenplayEntry; callbacks: BlockCallbacks }) {
  if (!entry.text) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-1 text-muted-foreground">
        <span className="italic">
          Da trascrivere{entry.durationMs ? ` · ${formatDuration(entry.durationMs)}` : ""}
        </span>
        <span className="no-print flex gap-1 font-sans">
          <Button variant="ghost" size="xs" onClick={() => callbacks.edit(entry, true)}>
            <PenLine /> Ascolta e scrivi
          </Button>
        </span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => callbacks.edit(entry)}
      className="w-full cursor-text rounded-md px-1 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Modifica la battuta: ${entry.text}`}
    >
      {entry.text}
    </button>
  );
}

function EntryEditor({
  entry,
  sessionId,
  callbacks,
}: {
  entry: ScreenplayEntry;
  sessionId: string;
  callbacks: BlockCallbacks;
}) {
  const { seek } = usePlayerActions();
  const [text, setText] = useState(entry.text);
  const [saving, setSaving] = useState(false);

  async function save(advance: boolean) {
    if (saving) return;
    const value = text.trim();
    setSaving(true);
    try {
      if (entry.lineId) {
        if (value) await setLineText(sessionId, entry.lineId, value);
        else await removeWithUndo(sessionId, entry.lineId);
      } else if (value) {
        await addLine(sessionId, { t: entry.t, text: value, speakerIds: entry.speakerIds });
      }
      if (advance) callbacks.advance(entry.key);
      else callbacks.edit(null);
    } catch {
      toast.error("Non sono riuscito a salvare la battuta.");
      setSaving(false);
    }
  }

  return (
    <div className="no-print grid gap-2 font-sans">
      <Textarea
        value={text}
        autoFocus
        rows={Math.min(8, Math.max(2, Math.ceil(text.length / 60)))}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") callbacks.edit(null);
          else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void save(true);
          }
        }}
        placeholder="Scrivi la battuta…"
        aria-label="Testo della battuta"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => void save(true)} disabled={saving}>
          <Check /> Salva e continua
        </Button>
        <Button size="sm" variant="ghost" onClick={() => seek(Math.max(0, entry.t - 1000), true)}>
          <Play /> Riascolta
        </Button>
        <Button size="sm" variant="ghost" onClick={() => callbacks.edit(null)}>
          Chiudi
        </Button>
        {entry.lineId && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-destructive"
            disabled={saving}
            onClick={() => {
              setSaving(true);
              void removeWithUndo(sessionId, entry.lineId!).then(() => callbacks.edit(null));
            }}
          >
            <Trash2 /> Elimina battuta
          </Button>
        )}
        <span className="hidden w-full text-xs text-muted-foreground sm:block">
          Invio salva e passa al prossimo turno da trascrivere · Maiusc+Invio va a capo · Esc chiude
        </span>
      </div>
    </div>
  );
}

function undoToast(message: string, sessionId: string, before: SessionContent | null) {
  toast.success(message, {
    action: before ? { label: "Annulla", onClick: () => void restoreSessionContent(sessionId, before) } : undefined,
  });
}

async function removeWithUndo(sessionId: string, lineId: string) {
  undoToast("Battuta eliminata.", sessionId, await deleteLine(sessionId, lineId));
}

function SpeakerPicker({
  block,
  sessionId,
  characters,
}: {
  block: ScreenplayBlock;
  sessionId: string;
  characters: Map<string, Character>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Cambia chi parla" title="Cambia chi parla">
          <UsersRound />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2 font-sans">
        {/* montato solo a popover aperto: è l'unico punto che legge la sessione */}
        <SpeakerPickerContent block={block} sessionId={sessionId} characters={characters} onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

function SpeakerPickerContent({
  block,
  sessionId,
  characters,
  onDone,
}: {
  block: ScreenplayBlock;
  sessionId: string;
  characters: Map<string, Character>;
  onDone: () => void;
}) {
  const session = use(SessionContext);
  const [selected, setSelected] = useState<string[]>(block.speakerIds);
  const [saving, setSaving] = useState(false);
  const participantIds = session?.participantIds ?? [];
  const options = [
    ...participantIds.map((id) => characters.get(id)).filter((c): c is Character => !!c),
    ...[...characters.values()].filter((c) => !c.archived && !participantIds.includes(c.id)),
  ];

  async function apply() {
    if (selected.length === 0 || saving) return;
    if (sameSpeakers(selected, block.speakerIds)) {
      onDone();
      return;
    }
    setSaving(true);
    try {
      const before = await reassignSpeakers(sessionId, { start: block.start, end: block.end }, block.speakerIds, selected);
      undoToast("Battute riassegnate.", sessionId, before);
      onDone();
    } catch {
      toast.error("Non sono riuscito a cambiare chi parla.");
      setSaving(false);
    }
  }

  return (
    <>
      <p className="px-2 pt-1 pb-2 text-xs text-muted-foreground">Chi sta parlando in questo blocco?</p>
      <div className="grid max-h-64 gap-0.5 overflow-y-auto">
        {options.map((c) => (
          <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
            <Checkbox
              checked={selected.includes(c.id)}
              onCheckedChange={(v) => setSelected((s) => (v ? [...s, c.id] : s.filter((x) => x !== c.id)))}
            />
            <CharacterAvatar character={c} className="size-6" />
            <span className="truncate">{c.name}</span>
          </label>
        ))}
      </div>
      <Button size="sm" className="mt-2 w-full" disabled={selected.length === 0 || saving} onClick={() => void apply()}>
        Applica
      </Button>
    </>
  );
}
