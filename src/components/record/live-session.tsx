"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MessagesSquare, Pause, Play, Square, UserRoundX, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { AddParticipantDialog } from "./add-participant-dialog";
import { ElapsedTime } from "./elapsed-time";
import { LevelMeter } from "./level-meter";
import { LiveTranscript } from "./live-transcript";
import { AddSpeakerTile, SpeakerTile } from "./speaker-tile";
import { useCharacterMap, useRecording, useSession } from "@/hooks/use-data";
import { formatLongDate } from "@/lib/format";
import { speakerNames } from "@/lib/screenplay";
import type { Character } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_ORDER = { master: 0, pc: 1, npc: 2 } as const;

function shortcutFor(index: number): string | undefined {
  return index < 10 ? String((index + 1) % 10) : undefined;
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

export function LiveSession() {
  const router = useRouter();
  const { state, engine } = useRecording();
  const characters = useCharacterMap();
  const session = useSession(state.sessionId);
  const [selecting, setSelecting] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);

  const participants = useMemo(() => {
    const list = state.participantIds.map((id) => characters.get(id)).filter((c): c is Character => !!c);
    // master, poi party nell'ordine di creazione, poi le comparse nell'ordine di arrivo
    return list
      .map((c, arrival) => ({ c, arrival }))
      .sort(
        (a, b) =>
          KIND_ORDER[a.c.kind] - KIND_ORDER[b.c.kind] ||
          (a.c.kind === "pc" ? a.c.order - b.c.order : a.arrival - b.arrival),
      )
      .map((x) => x.c);
  }, [state.participantIds, characters]);

  const active = state.activeSpeakerIds;
  const busy = state.status === "stopping" || state.status === "starting";

  const pick = useCallback(
    (id: string) => {
      if (selecting) setPending((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
      else engine.setSpeakers([id]);
    },
    [engine, selecting],
  );

  const startSelecting = useCallback(() => {
    setPending(active.length > 1 ? active : []);
    setSelecting(true);
  }, [active]);

  const confirmSelection = useCallback(() => {
    if (pending.length > 0) engine.setSpeakers(pending);
    setSelecting(false);
  }, [engine, pending]);

  const togglePause = useCallback(() => {
    if (state.status === "recording") engine.pause();
    else if (state.status === "paused") engine.resume();
  }, [engine, state.status]);

  async function stop() {
    setConfirmStop(false);
    setSelecting(false);
    try {
      const id = await engine.stop();
      if (id) router.push(`/session/?id=${id}&new=1`);
    } catch {
      toast.error("Errore durante il salvataggio. Riprova a terminare la sessione.");
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (document.querySelector("[role=dialog], [role=alertdialog]")) return;
      const key = event.key.toLowerCase();
      if (/^[0-9]$/.test(key)) {
        const index = key === "0" ? 9 : Number(key) - 1;
        const target = participants[index];
        if (target) {
          event.preventDefault();
          pick(target.id);
        }
      } else if (key === "s") {
        event.preventDefault();
        if (selecting) confirmSelection();
        else startSelecting();
      } else if (key === "enter" && selecting) {
        event.preventDefault();
        confirmSelection();
      } else if (key === "escape" && selecting) {
        setSelecting(false);
      } else if (key === "p") {
        event.preventDefault();
        togglePause();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [participants, pick, selecting, confirmSelection, startSelecting, togglePause]);

  const paused = state.status === "paused";
  const discussion = active.length > 1;

  return (
    <div className="mx-auto grid max-w-7xl gap-5">
      {/* barra di stato della registrazione */}
      <Card className="flex-row flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn("size-3 shrink-0 rounded-full", paused ? "bg-muted-foreground" : "rec-dot bg-rec")} />
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {state.status === "stopping" ? "Salvataggio…" : paused ? "In pausa" : "Registrazione in corso"}
            </div>
            <div className="truncate font-medium">
              {session?.title ?? "Sessione"}
              {session && (
                <span className="font-normal text-muted-foreground"> · {formatLongDate(session.date)}</span>
              )}
            </div>
          </div>
        </div>
        <ElapsedTime className="text-3xl font-semibold tracking-tight md:text-4xl" />
        <LevelMeter getLevel={engine.level} active={state.status === "recording"} className="hidden sm:flex" />
        <SpeechBadge status={state.speech} message={state.speechMessage} />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={togglePause} disabled={busy}>
            {paused ? <Play /> : <Pause />}
            {paused ? "Riprendi" : "Pausa"}
          </Button>
          <Button
            className="bg-rec text-white hover:bg-rec/90"
            onClick={() => setConfirmStop(true)}
            disabled={busy}
          >
            {state.status === "stopping" ? <Loader2 className="animate-spin" /> : <Square className="fill-current" />}
            Termina sessione
          </Button>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="grid content-start gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="mr-auto min-w-0">
              <h2 className="font-display text-xl font-bold tracking-wide">Chi sta parlando?</h2>
              <p className="truncate text-sm text-muted-foreground">
                {selecting ? (
                  "Seleziona i personaggi coinvolti nella discussione, poi conferma."
                ) : active.length === 0 ? (
                  "Nessuno selezionato: tocca un personaggio."
                ) : (
                  <>
                    {discussion ? "Discussione tra " : "Parla "}
                    <span className="font-medium text-foreground">{speakerNames(active, characters)}</span>
                  </>
                )}
              </p>
            </div>
            {selecting ? (
              <>
                <Button variant="ghost" onClick={() => setSelecting(false)}>
                  <X /> Annulla
                </Button>
                <Button onClick={confirmSelection} disabled={pending.length === 0}>
                  <MessagesSquare />
                  {pending.length > 1 ? `Avvia discussione (${pending.length})` : "Conferma"}
                </Button>
              </>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" onClick={() => engine.setSpeakers([])} disabled={active.length === 0 || busy}>
                      <UserRoundX /> Nessuno
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Pause, chiacchiere fuori gioco, pausa pizza…</TooltipContent>
                </Tooltip>
                <Button variant="secondary" onClick={startSelecting} disabled={busy}>
                  <MessagesSquare /> Seleziona
                </Button>
              </>
            )}
          </div>

          {discussion && !selecting && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm">
              <MessagesSquare className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Discussione in corso:</span>
              {active.map((id) => (
                <span key={id} className="flex items-center gap-1.5 rounded-full bg-muted py-0.5 pr-2.5 pl-0.5">
                  <CharacterAvatar character={characters.get(id)} className="size-5" />
                  {characters.get(id)?.name}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {participants.map((c, i) => (
              <SpeakerTile
                key={c.id}
                character={c}
                active={active.includes(c.id)}
                selecting={selecting}
                checked={pending.includes(c.id)}
                shortcut={shortcutFor(i)}
                onClick={() => pick(c.id)}
              />
            ))}
            <AddSpeakerTile onClick={() => setAdding(true)} />
          </div>

          <p className="hidden text-xs text-muted-foreground md:block">
            Scorciatoie: <Kbd>1</Kbd>–<Kbd>0</Kbd> personaggio · <Kbd>S</Kbd> seleziona/conferma discussione ·{" "}
            <Kbd>Esc</Kbd> annulla · <Kbd>P</Kbd> pausa
          </p>
        </section>

        <Card className="h-[60vh] gap-0 py-0 lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)]">
          <CardHeader className="border-b py-3">
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              Trascrizione dal vivo
              <span className="text-xs font-normal text-muted-foreground">{state.lines.length} battute</span>
            </CardTitle>
          </CardHeader>
          <div className="min-h-0 flex-1">
            <LiveTranscript
              lines={state.lines}
              interim={state.interim}
              characters={characters}
              enabled={state.speech === "listening" || state.speech === "paused" || state.lines.length > 0}
            />
          </div>
        </Card>
      </div>

      <AddParticipantDialog
        open={adding}
        onOpenChange={setAdding}
        excludeIds={state.participantIds}
        onAdd={(id, speakNow) => {
          engine.addParticipant(id);
          if (speakNow) {
            setSelecting(false);
            engine.setSpeakers([id]);
          }
        }}
      />

      <AlertDialog open={confirmStop} onOpenChange={setConfirmStop}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminare la sessione?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;audio e la trascrizione verranno salvati e potrai vedere la sceneggiatura della serata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continua a registrare</AlertDialogCancel>
            <AlertDialogAction className="bg-rec text-white hover:bg-rec/90" onClick={() => void stop()}>
              Termina e salva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {state.status === "stopping" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-lg">
            <Loader2 className="size-5 animate-spin" />
            Salvataggio della sessione…
          </div>
        </div>
      )}
    </div>
  );
}

function SpeechBadge({ status, message }: { status: string; message?: string }) {
  const label =
    status === "listening"
      ? "Trascrizione attiva"
      : status === "paused"
        ? "Trascrizione in pausa"
        : status === "unsupported"
          ? "Trascrizione non supportata"
          : status === "error"
            ? "Trascrizione: problema"
            : "Trascrizione disattivata";
  const dot =
    status === "listening" ? "bg-[#0ca30c]" : status === "error" ? "bg-[#fab219]" : "bg-muted-foreground";
  const badge = (
    <Badge variant="outline" className="h-6 gap-1.5 px-2.5">
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
  if (!message) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-64">{message}</TooltipContent>
    </Tooltip>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border bg-muted px-1 py-px font-mono text-[10px] text-foreground">{children}</kbd>;
}
