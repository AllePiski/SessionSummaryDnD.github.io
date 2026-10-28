"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dices, Download, Loader2, Pause, Play, RotateCcw, Square, TriangleAlert } from "lucide-react";
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
import { ElapsedTime } from "./elapsed-time";
import { LevelMeter } from "./level-meter";
import { useRecordingState } from "@/hooks/use-data";
import { audioFileName, saveBlob } from "@/lib/audio";
import { characterColor } from "@/lib/colors";
import { defaultSessionTitle, formatLongDate } from "@/lib/format";
import { getRecordingEngine } from "@/lib/recording-engine";
import { speakerNames } from "@/lib/screenplay";
import type { Character } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Barra fissa in cima alla registrazione: stato, cronometro, chi sta parlando
 * e i comandi (dadi, pausa, termina). Resta visibile mentre si scorre.
 */
export function RecordingStatusBar({
  characters,
  onLeaving,
  onOpenDice,
}: {
  characters: Map<string, Character>;
  onLeaving: (leaving: boolean) => void;
  onOpenDice: () => void;
}) {
  const router = useRouter();
  const engine = getRecordingEngine();
  const status = useRecordingState((s) => s.status);
  const title = useRecordingState((s) => s.title);
  const date = useRecordingState((s) => s.date);
  const [confirmStop, setConfirmStop] = useState(false);

  const paused = status === "paused";
  const busy = status === "stopping" || status === "save-failed";
  const customTitle = title && title !== defaultSessionTitle(date);

  async function stop() {
    setConfirmStop(false);
    onLeaving(true);
    try {
      const id = await engine.stop();
      if (id) router.push(`/session/?id=${id}&new=1`);
      else onLeaving(false);
    } catch {
      onLeaving(false);
      toast.error("Salvataggio non riuscito", { description: "Puoi riprovare oppure scaricare subito l'audio." });
    }
  }

  return (
    <>
      <Card
        className={cn(
          "sticky top-16 z-20 gap-0 bg-card/95 px-3 py-2.5 backdrop-blur supports-backdrop-filter:bg-card/85 sm:px-5 sm:py-3",
          paused && "ring-2 ring-warning",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className={cn("size-3 shrink-0 rounded-full", paused ? "bg-warning" : "rec-dot bg-rec-bright")} />
            <div className="hidden min-w-0 sm:block">
              <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {status === "stopping"
                  ? "Salvataggio…"
                  : status === "save-failed"
                    ? "Salvataggio non riuscito"
                    : paused
                      ? "In pausa"
                      : "Registrazione in corso"}
              </div>
              <div className="max-w-64 truncate font-medium">
                {title || "Sessione"}
                {customTitle && <span className="font-normal text-muted-foreground"> · {formatLongDate(date)}</span>}
              </div>
            </div>
          </div>
          <ElapsedTime className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl" />
          <NowSpeaking characters={characters} />
          <LevelMeter getLevel={engine.level} active={status === "recording"} className="hidden lg:flex" />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" className="h-11 px-3" onClick={onOpenDice} aria-label="Tira i dadi">
              <Dices /> <span className="hidden xl:inline">Dadi</span>
            </Button>
            <Button
              variant={paused ? "default" : "outline"}
              className="h-11 px-3 sm:px-4"
              onClick={() => (paused ? engine.resume() : engine.pause())}
              disabled={busy}
              aria-keyshortcuts="P"
            >
              {paused ? <Play /> : <Pause />}
              <span className={cn(!paused && "hidden sm:inline")}>{paused ? "Riprendi" : "Pausa"}</span>
            </Button>
            <Button
              className="h-11 bg-rec px-3 text-white hover:bg-rec/90 sm:px-4"
              onClick={() => setConfirmStop(true)}
              disabled={busy}
              aria-label="Termina sessione"
            >
              {status === "stopping" ? <Loader2 className="animate-spin" /> : <Square className="fill-current" />}
              <span className="hidden sm:inline">Termina</span>
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={confirmStop} onOpenChange={setConfirmStop}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminare la sessione?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;audio e i turni di parola verranno salvati e potrai rivedere la sessione come una sceneggiatura.
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

      {status === "stopping" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm" aria-busy>
          <div className="grid max-w-sm gap-1 rounded-xl border bg-card px-5 py-4 shadow-lg">
            <p className="flex items-center gap-3 font-medium">
              <Loader2 className="size-5 animate-spin" /> Salvataggio della sessione…
            </p>
            <p className="text-sm text-muted-foreground">Non chiudere la scheda: per le serate lunghe può volerci qualche secondo.</p>
          </div>
        </div>
      )}
      {status === "save-failed" && <SaveFailedPanel title={title} date={date} onRetry={() => void stop()} />}
    </>
  );
}

/** Chi sta parlando adesso, leggibile anche da lontano. */
function NowSpeaking({ characters }: { characters: Map<string, Character> }) {
  const active = useRecordingState((s) => s.activeSpeakerIds);
  const first = characters.get(active[0]);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3" aria-live="polite">
      {active.length === 0 ? (
        <span className="text-sm text-muted-foreground">Nessuno sta parlando</span>
      ) : (
        <>
          <span className="flex shrink-0 -space-x-3">
            {active.slice(0, 3).map((id) => (
              <span
                key={id}
                className="rounded-full ring-2 ring-offset-2 ring-offset-card"
                style={{ "--tw-ring-color": characterColor(characters.get(id)) } as React.CSSProperties}
              >
                <CharacterAvatar character={characters.get(id)} className="size-10 sm:size-12" />
              </span>
            ))}
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              {active.length > 1 ? "Discussione" : "Ora parla"}
            </span>
            <span className="block truncate text-lg font-semibold sm:text-xl">
              {active.length > 1 ? speakerNames(active, characters) : (first?.name ?? "Sconosciuto")}
            </span>
          </span>
        </>
      )}
    </div>
  );
}

/** Il salvataggio a fine sessione è fallito: si riprova o si scarica l'audio dalla memoria. */
function SaveFailedPanel({ title, date, onRetry }: { title: string; date: string; onRetry: () => void }) {
  async function download() {
    const blob = getRecordingEngine().unsavedAudio();
    if (!blob) return;
    const result = await saveBlob(blob, audioFileName({ date, title }, blob.type));
    if (result === "saved") toast.success("Audio scaricato.");
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="grid max-w-md gap-4 rounded-xl border bg-card p-5 shadow-lg" role="alertdialog" aria-labelledby="save-failed-title">
        <div className="flex gap-3">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <div className="grid gap-1">
            <h2 id="save-failed-title" className="font-semibold">
              Non sono riuscito a salvare la sessione
            </h2>
            <p className="text-sm text-muted-foreground">
              Di solito succede quando lo spazio del browser è finito. La registrazione è ancora in memoria: scarica
              subito l&apos;audio, poi riprova a salvare.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => void download()}>
            <Download /> Scarica l&apos;audio
          </Button>
          <Button onClick={onRetry}>
            <RotateCcw /> Riprova a salvare
          </Button>
        </div>
      </div>
    </div>
  );
}
