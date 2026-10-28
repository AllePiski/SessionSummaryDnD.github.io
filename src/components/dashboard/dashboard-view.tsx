"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, AudioLines, Dices, Mic, ScrollText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { D20Logo } from "@/components/app-shell";
import { PageLoading } from "@/components/page-header";
import { ElapsedTime } from "@/components/record/elapsed-time";
import { SessionRow } from "@/components/sessions/sessions-view";
import { TalkTime } from "@/components/session/talk-time";
import { useCharacterMap, useCharacters, useRecording, useSessions } from "@/hooks/use-data";
import { characterColor } from "@/lib/colors";
import { formatDuration, formatShortDate } from "@/lib/format";
import { raceLabel } from "@/lib/races";
import { speakerStats, type SpeakerStat } from "@/lib/screenplay";

export function DashboardView() {
  const characters = useCharacters();
  const sessions = useSessions();
  const characterMap = useCharacterMap();
  const { state } = useRecording();

  const totals = useMemo(() => {
    const done = (sessions ?? []).filter((s) => s.status !== "recording");
    const talk = new Map<string, SpeakerStat>();
    for (const s of done) {
      for (const stat of speakerStats(s)) {
        const prev = talk.get(stat.id);
        talk.set(
          stat.id,
          prev
            ? {
                ...prev,
                talkMs: prev.talkMs + stat.talkMs,
                turns: prev.turns + stat.turns,
                words: prev.words + stat.words,
                lines: prev.lines + stat.lines,
              }
            : { ...stat },
        );
      }
    }
    return {
      count: done.length,
      durationMs: done.reduce((sum, s) => sum + s.durationMs, 0),
      turns: done.reduce((sum, s) => sum + s.turns.length, 0),
      last: done[0],
      talk: [...talk.values()].sort((a, b) => b.talkMs - a.talkMs).slice(0, 8),
    };
  }, [sessions]);

  if (characters === undefined || sessions === undefined) return <PageLoading />;

  const party = characters.filter((c) => c.kind === "pc");
  const master = characters.find((c) => c.kind === "master");
  if (party.length === 0) return <Welcome />;

  const recording = state.status !== "idle";

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <Card className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 60% 120% at 100% 0%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 70%)",
          }}
        />
        <CardContent className="relative grid gap-6 py-2 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {recording ? "C'è una sessione in corso" : "Il party è riunito"}
              </p>
              <h2 className="font-display text-2xl font-bold tracking-wide text-balance md:text-3xl">
                {recording ? "La storia si sta scrivendo…" : "Pronti per la prossima avventura?"}
              </h2>
            </div>
            <div className="flex flex-wrap gap-4">
              {[...(master ? [master] : []), ...party].map((c) => (
                <div key={c.id} className="grid w-20 justify-items-center gap-1 text-center">
                  <span className="relative">
                    <CharacterAvatar character={c} className="size-14" />
                    <span
                      className="absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-card"
                      style={{ background: characterColor(c) }}
                    />
                  </span>
                  <span className="w-full truncate text-xs font-medium">{c.name}</span>
                  <span className="-mt-1 w-full truncate text-[10px] text-muted-foreground">
                    {c.kind === "master" ? "Master" : raceLabel(c.raceId, c.gender)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2 md:justify-items-end">
            {recording ? (
              <Button asChild size="lg" className="h-14 gap-3 rounded-xl bg-rec px-6 text-base text-white hover:bg-rec/90">
                <Link href="/record">
                  <span className="rec-dot size-3 rounded-full bg-white" />
                  Torna alla registrazione · <ElapsedTime />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="h-14 gap-3 rounded-xl bg-rec px-6 text-base text-white shadow-lg shadow-rec/25 hover:bg-rec/90"
              >
                <Link href="/record">
                  <Mic className="size-5" /> Inizia una nuova sessione
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link href="/party">
                <Users /> Gestisci il party
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Sessioni registrate" value={String(totals.count)} />
        <Tile label="Tempo di gioco registrato" value={totals.durationMs ? formatDuration(totals.durationMs) : "—"} />
        <Tile label="Turni di parola" value={totals.turns.toLocaleString("it-IT")} />
        <Tile
          label="Ultima sessione"
          value={totals.last ? formatShortDate(totals.last.date) : "—"}
          detail={totals.last?.title}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Sessioni recenti</CardTitle>
            <CardDescription>Apri una sessione per riascoltarla e leggerne la sceneggiatura.</CardDescription>
            {sessions.length > 0 && (
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sessions">
                    Archivio <ArrowRight />
                  </Link>
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="grid gap-3">
            {sessions.length === 0 ? (
              <div className="grid justify-items-center gap-2 rounded-xl border border-dashed py-10 text-center">
                <ScrollText className="size-8 text-muted-foreground" />
                <p className="font-medium">Nessuna sessione ancora</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Avvia la registrazione all&apos;inizio della serata e seleziona chi sta parlando.
                </p>
              </div>
            ) : (
              sessions.slice(0, 5).map((s) => <SessionRow key={s.id} session={s} characters={characterMap} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AudioLines className="size-4 text-muted-foreground" /> Chi parla di più
            </CardTitle>
            <CardDescription>Tempo di parola su tutte le sessioni.</CardDescription>
          </CardHeader>
          <CardContent>
            <TalkTime stats={totals.talk} characters={characterMap} totalMs={totals.durationMs} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Tile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card size="sm" className="gap-1 px-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {detail && <p className="truncate text-xs text-muted-foreground">{detail}</p>}
    </Card>
  );
}

function Welcome() {
  const steps = [
    { icon: Users, title: "Crea il party", text: "Indica quanti giocatori siete, poi nome, razza e foto di ogni personaggio." },
    {
      icon: Mic,
      title: "Registra la serata",
      text: "Durante il gioco tocca l'avatar di chi parla: master, eroi, PNG o un'intera discussione.",
    },
    {
      icon: ScrollText,
      title: "Rivivi la sessione",
      text: "A fine serata trovi la sceneggiatura con le battute di ognuno e l'audio da scaricare.",
    },
  ];
  return (
    <div className="mx-auto grid max-w-3xl justify-items-center gap-8 py-6 text-center md:py-12">
      <D20Logo className="size-20" />
      <div className="grid gap-3">
        <h2 className="font-display text-3xl font-bold tracking-wide text-balance md:text-4xl">Benvenuto al tavolo</h2>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Registra l&apos;audio delle tue sessioni di D&amp;D, segna chi sta parlando e ottieni la serata scritta come
          una sceneggiatura. Tutto resta nel tuo browser.
        </p>
      </div>
      <div className="grid w-full gap-3 text-left sm:grid-cols-3">
        {steps.map((s, i) => (
          <Card key={s.title} className="gap-2 px-4">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                {i + 1}
              </span>
              {s.title}
            </span>
            <p className="text-sm text-muted-foreground">{s.text}</p>
          </Card>
        ))}
      </div>
      <div className="grid justify-items-center gap-3">
        <Button asChild size="lg" className="h-12 px-6 text-base">
          <Link href="/party">
            Crea il party <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dice">
            <Dices /> Vuoi solo tirare i dadi?
          </Link>
        </Button>
      </div>
    </div>
  );
}
