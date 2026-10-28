"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageLoading } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { NotesCard } from "./notes-card";
import { MiniPlayer, PlayerControls, PlayerProvider, usePlayerState } from "./player";
import { SavedDialog } from "./saved-dialog";
import { ScreenplayView } from "./screenplay-view";
import { SessionHeader } from "./session-header";
import { SpeakerTimeline } from "./speaker-timeline";
import { TalkTime } from "./talk-time";
import { useCharacterMap, useSession, useSessionAudio } from "@/hooks/use-data";
import { audioFileName, saveBlob } from "@/lib/audio";
import { countWords, formatBytes, formatDuration, plural } from "@/lib/format";
import { speakerNames, speakerStats } from "@/lib/screenplay";
import type { Character, Session } from "@/lib/types";

/** Pagina di una sessione: l'id arriva da ?id=… (le sessioni vivono nel browser). */
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
  const stats = useMemo(() => speakerStats(session), [session]);
  const words = useMemo(() => session.lines.reduce((sum, l) => sum + countWords(l.text), 0), [session.lines]);
  const cast = session.participantIds.map((pid) => characters.get(pid)).filter((c): c is Character => !!c);
  const discussions = session.turns.filter((t) => t.speakerIds.length > 1).length;

  async function downloadAudio() {
    if (!audio) return;
    const result = await saveBlob(audio.blob, audioFileName(session, audio.mimeType));
    if (result === "saved") toast.success("Audio salvato.");
  }

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-6">
      <SessionHeader
        session={session}
        characters={characters}
        cast={cast}
        canDownload={!!audio}
        onDownload={() => void downloadAudio()}
      />

      <div className="no-print grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Durata" value={formatDuration(session.durationMs)} />
        <StatTile
          label="Turni di parola"
          value={session.turns.length.toLocaleString("it-IT")}
          detail={
            session.lines.length
              ? `${plural(session.lines.length, "battuta", "battute")} · ${plural(words, "parola", "parole")}`
              : undefined
          }
        />
        <StatTile
          label="Personaggi in scena"
          value={String(cast.length)}
          detail={`${stats.length} ${stats.length === 1 ? "ha parlato" : "hanno parlato"}`}
        />
        <StatTile label="Discussioni" value={String(discussions)} detail="momenti con più personaggi" />
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Ascolta la sessione</CardTitle>
          <CardDescription>
            {audio
              ? `${audioFileName(session, audio.mimeType)} · ${formatBytes(audio.blob.size)}. Tocca una corsia per saltare a quel momento.`
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
            <CardDescription>
              Tocca una battuta per correggerla; con i pulsanti accanto ascolti quel punto o cambi chi parla.
            </CardDescription>
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

      <SessionMiniPlayer session={session} characters={characters} />

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

/** Mini-player con il nome di chi parla nel punto in ascolto. */
function SessionMiniPlayer({ session, characters }: { session: Session; characters: Map<string, Character> }) {
  const { currentMs } = usePlayerState();
  const turn = session.turns.find((t) => currentMs >= t.start && currentMs < t.end);
  return <MiniPlayer label={turn ? speakerNames(turn.speakerIds, characters) : undefined} />;
}
