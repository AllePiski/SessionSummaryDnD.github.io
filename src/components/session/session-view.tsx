"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  Download,
  FileText,
  FileType,
  Pencil,
  Printer,
  ScrollText,
  Trash2,
} from "lucide-react";
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
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AvatarStack } from "@/components/avatars/character-avatar";
import { DatePicker } from "@/components/date-picker";
import { PageLoading } from "@/components/page-header";
import { PlayerControls, PlayerProvider } from "./player";
import { ScreenplayView } from "./screenplay-view";
import { SpeakerTimeline } from "./speaker-timeline";
import { TalkTime } from "./talk-time";
import { useCharacterMap, useSession, useSessionAudio } from "@/hooks/use-data";
import { audioFileName, saveBlob, sessionFileBase } from "@/lib/audio";
import { countWords, formatBytes, formatDuration } from "@/lib/format";
import { deleteSession, updateSessionInfo } from "@/lib/repo";
import { screenplayToMarkdown, screenplayToText, speakerStats } from "@/lib/screenplay";
import type { Character, Session } from "@/lib/types";

export function SessionView() {
  const params = useSearchParams();
  const id = params.get("id");
  const isNew = params.get("new") === "1";
  const session = useSession(id);
  const audio = useSessionAudio(id);
  const characters = useCharacterMap();

  if (session === undefined) return <PageLoading />;
  if (session === null) {
    return (
      <div className="mx-auto grid max-w-md justify-items-center gap-4 py-16 text-center">
        <ScrollText className="size-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Sessione non trovata</h2>
        <p className="text-muted-foreground">Forse è stata eliminata, oppure è stata registrata su un altro browser.</p>
        <Button asChild variant="outline">
          <Link href="/sessions">
            <ArrowLeft /> Archivio sessioni
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <PlayerProvider blob={audio?.blob} durationMs={session.durationMs}>
      <SessionDashboard session={session} audio={audio ?? null} characters={characters} isNew={isNew} />
    </PlayerProvider>
  );
}

function SessionDashboard({
  session,
  audio,
  characters,
  isNew,
}: {
  session: Session;
  audio: { blob: Blob; mimeType: string } | null;
  characters: Map<string, Character>;
  isNew: boolean;
}) {
  const router = useRouter();
  const [follow, setFollow] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const stats = useMemo(() => speakerStats(session), [session]);
  const words = useMemo(() => session.lines.reduce((sum, l) => sum + countWords(l.text), 0), [session.lines]);
  const cast = session.participantIds.map((pid) => characters.get(pid)).filter((c): c is Character => !!c);
  const discussions = session.turns.filter((t) => t.speakerIds.length > 1).length;

  async function downloadAudio() {
    if (!audio) return;
    const result = await saveBlob(audio.blob, audioFileName(session, audio.mimeType));
    if (result === "saved") toast.success("Audio salvato.");
  }

  async function exportText(kind: "txt" | "md") {
    const content = kind === "txt" ? screenplayToText(session, characters) : screenplayToMarkdown(session, characters);
    const blob = new Blob([content], { type: kind === "txt" ? "text/plain" : "text/markdown" });
    const result = await saveBlob(blob, `${sessionFileBase(session)} - sceneggiatura.${kind}`);
    if (result === "saved") toast.success("Sceneggiatura esportata.");
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(screenplayToText(session, characters));
      toast.success("Sceneggiatura copiata negli appunti.");
    } catch {
      toast.error("Copia non riuscita.");
    }
  }

  async function remove() {
    await deleteSession(session.id);
    toast.success("Sessione eliminata.");
    router.push("/sessions");
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <div className="no-print flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <EditableTitle session={session} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DatePicker
              value={session.date}
              onChange={(date) => void updateSessionInfo(session.id, { date })}
              className="h-8"
            />
            {session.status === "interrupted" && <Badge variant="secondary">Recuperata dopo un&apos;interruzione</Badge>}
            {session.transcription === "none" && <Badge variant="outline">Senza trascrizione automatica</Badge>}
            <AvatarStack characters={cast} max={7} className="ml-1" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void downloadAudio()} disabled={!audio}>
            <Download /> Scarica audio
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ScrollText /> Esporta sceneggiatura
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => void exportText("txt")}>
                <FileText /> Testo (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void exportText("md")}>
                <FileType /> Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimeout(() => window.print(), 50)}>
                <Printer /> Stampa o salva PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void copyText()}>
                <ClipboardCopy /> Copia negli appunti
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)} aria-label="Elimina sessione">
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="no-print grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Durata" value={formatDuration(session.durationMs)} />
        <StatTile label="Battute trascritte" value={session.lines.length.toLocaleString("it-IT")} detail={`${words.toLocaleString("it-IT")} parole`} />
        <StatTile label="Personaggi in scena" value={String(cast.length)} detail={`${stats.length} hanno parlato`} />
        <StatTile label="Discussioni" value={String(discussions)} detail={`${session.turns.length} turni di parola`} />
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Ascolta la sessione</CardTitle>
          <CardDescription>
            {audio
              ? `${audioFileName(session, audio.mimeType)} · ${formatBytes(audio.blob.size)}. Clicca su una corsia per saltare a quel momento.`
              : "Audio non disponibile per questa sessione."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <PlayerControls />
          <SpeakerTimeline session={session} characters={characters} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="print:shadow-none print:ring-0">
          <CardHeader className="no-print border-b">
            <CardTitle>Sceneggiatura</CardTitle>
            <CardDescription>Clicca su una battuta per correggerla; usa i pulsanti a destra per ascoltare o cambiare chi parla.</CardDescription>
            <CardAction className="flex items-center gap-2">
              <Switch id="follow" checked={follow} onCheckedChange={setFollow} />
              <Label htmlFor="follow" className="text-xs font-normal whitespace-nowrap">
                Segui l&apos;audio
              </Label>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-2">
            <ScreenplayView session={session} characters={characters} follow={follow} />
          </CardContent>
        </Card>

        <div className="no-print grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tempo di parola</CardTitle>
              <CardDescription>Le discussioni contano per ogni partecipante.</CardDescription>
            </CardHeader>
            <CardContent>
              <TalkTime stats={stats} characters={characters} totalMs={session.durationMs} />
            </CardContent>
          </Card>
          <NotesCard session={session} />
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa sessione?</AlertDialogTitle>
            <AlertDialogDescription>
              Audio e sceneggiatura salvati nel browser verranno cancellati. I file già scaricati non vengono toccati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void remove()}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SavedDialog
        open={isNew}
        session={session}
        audio={audio}
        onDownload={() => void downloadAudio()}
        onClose={() => router.replace(`/session/?id=${session.id}`)}
      />
    </div>
  );
}

function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card size="sm" className="gap-1 px-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </Card>
  );
}

function EditableTitle({ session }: { session: Session }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(session.title);

  async function save() {
    const title = value.trim();
    if (title && title !== session.title) await updateSessionInfo(session.id, { title });
    setEditing(false);
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
        <Button type="submit" size="icon" aria-label="Salva titolo">
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
      className="group flex max-w-full items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <h2 className="truncate font-display text-2xl font-bold tracking-wide md:text-3xl">{session.title}</h2>
      <Pencil className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function NotesCard({ session }: { session: Session }) {
  const [notes, setNotes] = useState(session.notes ?? "");
  const dirty = notes !== (session.notes ?? "");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Note del master</CardTitle>
        <CardDescription>Riassunto, bottino, cose da ricordare per la prossima volta.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Textarea
          value={notes}
          rows={6}
          placeholder="Il party ha trovato la mappa della cripta…"
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => dirty && void updateSessionInfo(session.id, { notes })}
        />
        <p className="text-xs text-muted-foreground">{dirty ? "Salvataggio quando esci dal campo…" : "Salvate."}</p>
      </CardContent>
    </Card>
  );
}

function SavedDialog({
  open,
  session,
  audio,
  onDownload,
  onClose,
}: {
  open: boolean;
  session: Session;
  audio: { blob: Blob; mimeType: string } | null;
  onDownload: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sessione salvata! 🎲</DialogTitle>
          <DialogDescription>
            {formatDuration(session.durationMs)} di gioco e {session.lines.length} battute trascritte. L&apos;audio è nel
            browser: scaricane una copia per tenerlo al sicuro.
          </DialogDescription>
        </DialogHeader>
        {audio && (
          <p className="rounded-lg bg-muted p-3 text-sm break-all">
            {audioFileName(session, audio.mimeType)}
            <span className="text-muted-foreground"> · {formatBytes(audio.blob.size)}</span>
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Più tardi
          </Button>
          <Button
            disabled={!audio}
            onClick={() => {
              onDownload();
              onClose();
            }}
          >
            <Download /> Scarica l&apos;audio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
