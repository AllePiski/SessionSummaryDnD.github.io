"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { MessagesSquare, Play, UserRoundX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { AddParticipantDialog } from "./add-participant-dialog";
import { AddSpeakerTile, SpeakerTile } from "./speaker-tile";
import { useRecordingState } from "@/hooks/use-data";
import { getRecordingEngine } from "@/lib/recording-engine";
import type { Character } from "@/lib/types";

function shortcutFor(index: number): string | undefined {
  return index < 10 ? String((index + 1) % 10) : undefined;
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

const toggleId = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/**
 * Le tessere dei personaggi: chi parla, discussioni tra più personaggi,
 * scorciatoie da tastiera e overlay di pausa.
 */
export function SpeakerBoard({
  participants,
  characters,
}: {
  participants: Character[];
  characters: Map<string, Character>;
}) {
  const engine = getRecordingEngine();
  const active = useRecordingState((s) => s.activeSpeakerIds);
  const status = useRecordingState((s) => s.status);
  const participantIds = useRecordingState((s) => s.participantIds);
  const [selecting, setSelecting] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  const paused = status === "paused";
  const busy = status === "stopping" || status === "save-failed";

  /** Tocco su una tessera: in modalità discussione o con Maiusc aggiunge/toglie, altrimenti sceglie. */
  const pick = useCallback(
    (id: string, toggle: boolean) => {
      if (selecting) {
        setPending((p) => toggleId(p, id));
        return;
      }
      const current = engine.getSnapshot().activeSpeakerIds;
      engine.setSpeakers(toggle ? toggleId(current, id) : [id]);
    },
    [engine, selecting],
  );

  function startSelecting() {
    setPending(active.length > 1 ? active : []);
    setSelecting(true);
  }

  function confirmSelection() {
    if (pending.length > 0) engine.setSpeakers(pending);
    setSelecting(false);
  }

  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
    if (document.querySelector("[role=dialog], [role=alertdialog]")) return;
    // event.code: funziona anche con Maiusc premuto e con qualsiasi layout di tastiera
    const digit = /^(?:Digit|Numpad)([0-9])$/.exec(event.code)?.[1];
    const key = event.key.toLowerCase();
    if (digit !== undefined) {
      const target = participants[digit === "0" ? 9 : Number(digit) - 1];
      if (target) {
        event.preventDefault();
        pick(target.id, event.shiftKey);
      }
    } else if (key === "d" || key === "s") {
      event.preventDefault();
      if (selecting) confirmSelection();
      else startSelecting();
    } else if (key === "enter" && selecting) {
      event.preventDefault();
      confirmSelection();
    } else if (key === "escape" && selecting) {
      setSelecting(false);
    } else if (key === "n" && !selecting) {
      event.preventDefault();
      engine.setSpeakers([]);
    } else if (key === "p") {
      event.preventDefault();
      if (status === "recording") engine.pause();
      else if (status === "paused") engine.resume();
    }
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => onShortcut(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <section className="grid content-start gap-4" aria-label="Chi sta parlando">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-display text-xl font-bold tracking-wide">Chi sta parlando?</h2>
        {!selecting && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-11"
                  onClick={() => engine.setSpeakers([])}
                  disabled={active.length === 0 || busy}
                  aria-keyshortcuts="N"
                >
                  <UserRoundX /> Nessuno
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pause, chiacchiere fuori gioco, pausa pizza… (tasto N)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" className="h-11" onClick={startSelecting} disabled={busy} aria-keyshortcuts="D">
                  <MessagesSquare /> Discussione
                </Button>
              </TooltipTrigger>
              <TooltipContent>Più personaggi parlano insieme (tasto D, oppure Maiusc + tocco)</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      {active.length > 1 && !selecting && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm">
          <MessagesSquare className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Discussione in corso:</span>
          {active.map((id) => (
            <span key={id} className="flex items-center gap-1.5 rounded-full bg-muted py-0.5 pr-1 pl-0.5">
              <CharacterAvatar character={characters.get(id)} className="size-5" />
              {characters.get(id)?.name}
              <button
                type="button"
                onClick={() => engine.setSpeakers(active.filter((x) => x !== id))}
                className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
                aria-label={`Togli ${characters.get(id)?.name ?? "personaggio"} dalla discussione`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="@container relative">
        <div className="grid grid-cols-2 gap-3 @md:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-5">
          {participants.map((c, i) => (
            <SpeakerTile
              key={c.id}
              character={c}
              active={active.includes(c.id)}
              paused={paused}
              selecting={selecting}
              checked={pending.includes(c.id)}
              shortcut={shortcutFor(i)}
              onPick={pick}
            />
          ))}
          <AddSpeakerTile onClick={() => setAdding(true)} />
        </div>
        {paused && <PausedOverlay onResume={() => engine.resume()} />}
      </div>

      {selecting && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-popover/95 p-3 shadow-lg backdrop-blur">
          <MessagesSquare className="size-5 text-muted-foreground" />
          <span className="mr-auto text-sm">
            <span className="font-medium">Chi partecipa alla discussione?</span>{" "}
            <span className="text-muted-foreground">
              {pending.length === 0
                ? "Tocca i personaggi"
                : `${pending.length} ${pending.length === 1 ? "selezionato" : "selezionati"}`}
            </span>
          </span>
          <Button variant="ghost" className="h-11" onClick={() => setSelecting(false)}>
            Annulla
          </Button>
          <Button className="h-11" onClick={confirmSelection} disabled={pending.length === 0}>
            {pending.length > 1 ? "Avvia discussione" : "Conferma"}
          </Button>
        </div>
      )}

      <p className="hidden text-xs text-muted-foreground pointer-fine:block">
        Tasti: <Kbd>1</Kbd>–<Kbd>0</Kbd> chi parla (con <Kbd>Maiusc</Kbd> aggiungi alla discussione) · <Kbd>D</Kbd>{" "}
        discussione · <Kbd>N</Kbd> nessuno · <Kbd>P</Kbd> pausa · <Kbd>Esc</Kbd> annulla
      </p>

      <AddParticipantDialog
        open={adding}
        onOpenChange={setAdding}
        participantIds={participantIds}
        onAdd={(id, speakNow) => {
          engine.addParticipant(id);
          if (speakNow) {
            setSelecting(false);
            engine.setSpeakers([id]);
          }
        }}
      />
    </section>
  );
}

function PausedOverlay({ onResume }: { onResume: () => void }) {
  const pausedAt = useRecordingState((s) => s.pausedAt);
  const [minutes, setMinutes] = useState(0);
  useEffect(() => {
    const update = () => setMinutes(pausedAt ? Math.floor((Date.now() - pausedAt) / 60_000) : 0);
    const first = setTimeout(update, 0);
    const id = setInterval(update, 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [pausedAt]);
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-background/75 backdrop-blur-[2px]">
      <div className="grid justify-items-center gap-3 p-4 text-center">
        <p className="text-lg font-semibold">Registrazione in pausa</p>
        <p className="text-sm text-muted-foreground">
          {minutes < 1 ? "Da meno di un minuto" : `Da ${minutes} min`} · l&apos;audio non viene registrato
        </p>
        <Button size="lg" className="h-12 px-6 text-base" onClick={onResume} aria-keyshortcuts="P">
          <Play className="fill-current" /> Riprendi (P)
        </Button>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border bg-muted px-1 py-px font-mono text-xs text-foreground">{children}</kbd>;
}
