"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Crown, FileAudio, Plus, TriangleAlert, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { CharacterDialog } from "@/components/characters/character-dialog";
import { DatePicker } from "@/components/date-picker";
import { PageHeader, PageLoading } from "@/components/page-header";
import { SpeechLanguageSelect } from "@/components/speech-language-select";
import { SETTING_DEVICE } from "@/lib/settings";
import { MicCheck } from "./mic-check";
import { useClientValue } from "@/hooks/use-client-value";
import { useCharacters, useSetting, useTranscription } from "@/hooks/use-data";
import { audioFileName, isRecordingSupported, pickMimeType } from "@/lib/audio";
import { characterSubtitle, splitByKind } from "@/lib/characters";
import { defaultSessionTitle, todayISO } from "@/lib/format";
import { getRecordingEngine } from "@/lib/recording-engine";
import { createSession, deleteSession, requestPersistentStorage, setSetting } from "@/lib/repo";
import type { Character } from "@/lib/types";
import { cn } from "@/lib/utils";


export function SessionSetup() {
  const characters = useCharacters();
  const support = {
    recording: useClientValue(isRecordingSupported, true),
    mime: useClientValue(pickMimeType, "audio/webm"),
  };
  const speech = useTranscription();
  const savedDevice = useSetting(SETTING_DEVICE, "");

  const [date, setDate] = useState(todayISO);
  const [title, setTitle] = useState("");
  const [absent, setAbsent] = useState<string[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [starting, setStarting] = useState(false);

  if (characters === undefined) return <PageLoading />;

  const { master, pcs, npcs } = splitByKind(characters);

  if (!master || pcs.length === 0) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title="Nuova sessione" />
        <Card>
          <CardContent className="grid justify-items-center gap-4 py-10 text-center">
            <Users className="size-10 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Prima serve un party</h3>
              <p className="text-muted-foreground">Indica quanti giocatori siete e chi interpreta chi.</p>
            </div>
            <Button asChild>
              <Link href="/party">Crea il party</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const effectiveDevice = deviceId ?? savedDevice;
  const sessionTitle = title.trim() || defaultSessionTitle(date);
  const presentPcs = pcs.filter((c) => !absent.includes(c.id));
  const participantIds = [master.id, ...presentPcs.map((c) => c.id), ...guests];
  const canTranscribe = speech.enabled;
  const lang = speech.lang;

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  async function start() {
    if (!master) return;
    setStarting(true);
    const session = await createSession({
      date,
      title: sessionTitle,
      participantIds,
      language: lang,
      transcription: canTranscribe ? "live" : "none",
    });
    try {
      await getRecordingEngine().start({
        sessionId: session.id,
        title: sessionTitle,
        date,
        participantIds,
        initialSpeakerIds: [master.id],
        language: lang,
        transcribe: canTranscribe,
        deviceId: effectiveDevice || undefined,
      });
      void requestPersistentStorage();
    } catch (error) {
      await deleteSession(session.id);
      toast.error(error instanceof Error ? error.message : "Impossibile avviare la registrazione.");
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Nuova sessione"
        description="Scegli chi gioca oggi, controlla il microfono e avvia la registrazione."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Chi c&apos;è al tavolo oggi?</CardTitle>
              <CardDescription>
                Tocca un personaggio per escluderlo. Durante la sessione potrai aggiungerne altri.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <ParticipantToggle character={master} selected locked />
              {pcs.map((c) => (
                <ParticipantToggle
                  key={c.id}
                  character={c}
                  selected={!absent.includes(c.id)}
                  onToggle={() => setAbsent((a) => toggle(a, c.id))}
                />
              ))}
              {guests
                .map((id) => characters.find((c) => c.id === id))
                .filter((c): c is Character => !!c && c.kind !== "npc")
                .map((c) => (
                  <ParticipantToggle key={c.id} character={c} selected onToggle={() => setGuests((g) => toggle(g, c.id))} />
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PNG previsti</CardTitle>
              <CardDescription>
                Facoltativo: se sai già chi comparirà puoi aggiungerlo ora, altrimenti lo farai al volo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {npcs.map((c) => {
                const on = guests.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setGuests((g) => toggle(g, c.id))}
                    aria-pressed={on}
                    className={cn(
                      "flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on ? "border-primary/60 bg-primary/10" : "hover:bg-accent",
                    )}
                  >
                    <CharacterAvatar character={c} className="size-7" />
                    {c.name}
                    {on && <Check className="size-3.5 text-primary" />}
                  </button>
                );
              })}
              <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={() => setAdding(true)}>
                <Plus /> Nuovo personaggio
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dettagli</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="session-date">Data di gioco</Label>
                <DatePicker id="session-date" value={date} onChange={setDate} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="session-title">
                  Titolo <span className="font-normal text-muted-foreground">(facoltativo)</span>
                </Label>
                <Input
                  id="session-title"
                  value={title}
                  placeholder={defaultSessionTitle(date)}
                  maxLength={80}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
                <FileAudio className="mt-px size-3.5 shrink-0" />
                <span>
                  L&apos;audio si chiamerà{" "}
                  <span className="font-medium break-all text-foreground">
                    {audioFileName({ date, title: sessionTitle }, support.mime)}
                  </span>
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audio</CardTitle>
              <CardDescription>
                Durante la sessione selezioni tu chi sta parlando. Il riconoscimento vocale è facoltativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <MicCheck
                deviceId={effectiveDevice}
                onDeviceChange={(id) => {
                  setDeviceId(id);
                  void setSetting(SETTING_DEVICE, id);
                }}
              />
              {speech.supported ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="setup-transcribe" className="flex-col items-start gap-0.5 font-normal">
                      <span>Riconoscimento vocale</span>
                      <span className="text-xs text-muted-foreground">Trascrive anche le battute</span>
                    </Label>
                    <Switch id="setup-transcribe" checked={speech.enabled} onCheckedChange={speech.setEnabled} />
                  </div>
                  {speech.enabled && (
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="setup-lang" className="font-normal">
                        Lingua
                      </Label>
                      <SpeechLanguageSelect id="setup-lang" className="w-40" />
                    </div>
                  )}
                </>
              ) : (
                <p className="flex gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  Il riconoscimento vocale non è disponibile in questo browser (serve Chrome, Edge o Safari). Audio e
                  turni di parola vengono registrati comunque, e potrai scrivere le battute dopo.
                </p>
              )}
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="h-14 gap-3 rounded-xl bg-rec text-base text-white shadow-lg shadow-rec/25 hover:bg-rec/90"
            onClick={() => void start()}
            disabled={starting || !support.recording}
          >
            <span className="size-3 rounded-full bg-white" />
            {starting ? "Avvio…" : "Inizia registrazione"}
          </Button>
          {!support.recording && (
            <p className="text-sm text-destructive">Questo browser non permette di registrare audio.</p>
          )}
          <p className="text-center text-xs text-muted-foreground">
            {participantIds.length} partecipanti · il master parla per primo
          </p>
        </div>
      </div>

      <CharacterDialog
        open={adding}
        onOpenChange={setAdding}
        defaultKind="npc"
        onSaved={(c) => setGuests((g) => [...g, c.id])}
      />
    </div>
  );
}

function ParticipantToggle({
  character,
  selected,
  locked,
  onToggle,
}: {
  character: Character;
  selected: boolean;
  locked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={locked}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-default",
        selected ? "bg-card" : "border-dashed opacity-50 grayscale",
        !locked && "hover:border-foreground/25",
      )}
    >
      <span className="absolute top-2 right-2">
        {locked ? (
          <Crown className="size-4 text-primary" />
        ) : (
          <span
            className={cn(
              "grid size-5 place-items-center rounded-full border",
              selected ? "border-transparent bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            {selected && <Check className="size-3" strokeWidth={3} />}
          </span>
        )}
      </span>
      <CharacterAvatar character={character} showColor className="size-16" />
      <span className="w-full min-w-0">
        <span className="block truncate text-sm font-medium">{character.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {characterSubtitle(character)}
        </span>
      </span>
    </button>
  );
}
