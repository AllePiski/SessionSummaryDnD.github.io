"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Download, Mic, ScrollText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AvatarStack } from "@/components/avatars/character-avatar";
import { PageHeader, PageLoading } from "@/components/page-header";
import { useCharacterMap, useSessions } from "@/hooks/use-data";
import { audioFileName, saveBlob } from "@/lib/audio";
import { db } from "@/lib/db";
import { formatBytes, formatDuration, formatLongDate } from "@/lib/format";
import type { Character, Session } from "@/lib/types";

export function SessionsView() {
  const sessions = useSessions();
  const characters = useCharacterMap();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = (sessions ?? []).filter(
      (s) => !q || `${s.title} ${s.date} ${formatLongDate(s.date)} ${s.notes ?? ""}`.toLowerCase().includes(q),
    );
    const byMonth = new Map<string, Session[]>();
    for (const s of filtered) {
      const key = s.date.slice(0, 7);
      byMonth.set(key, [...(byMonth.get(key) ?? []), s]);
    }
    return [...byMonth.entries()];
  }, [sessions, query]);

  if (sessions === undefined) return <PageLoading />;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Archivio sessioni"
        description="Tutte le serate registrate, dalla più recente. Ogni audio prende il nome dalla data di gioco."
        actions={
          <Button asChild>
            <Link href="/record">
              <Mic /> Nuova sessione
            </Link>
          </Button>
        }
      />

      {sessions.length === 0 ? (
        <Card className="items-center gap-3 py-14 text-center">
          <ScrollText className="size-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Ancora nessuna sessione</h3>
          <p className="max-w-sm text-muted-foreground">
            Registra la prima serata: qui troverai audio, sceneggiatura e statistiche.
          </p>
          <Button asChild className="mt-2">
            <Link href="/record">Inizia a registrare</Link>
          </Button>
        </Card>
      ) : (
        <>
          <div className="relative mb-6 max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per titolo, data o note…"
              className="pl-8"
              aria-label="Cerca sessioni"
            />
          </div>
          {groups.length === 0 && <p className="text-muted-foreground">Nessuna sessione corrisponde alla ricerca.</p>}
          <div className="grid gap-8">
            {groups.map(([month, list]) => (
              <section key={month}>
                <h3 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                  {format(parseISO(`${month}-01`), "MMMM yyyy", { locale: it })}
                </h3>
                <div className="grid gap-3">
                  {list.map((s) => (
                    <SessionRow key={s.id} session={s} characters={characters} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SessionRow({ session, characters }: { session: Session; characters: Map<string, Character> }) {
  const date = parseISO(session.date);
  const cast = session.participantIds.map((id) => characters.get(id)).filter((c): c is Character => !!c);
  const live = session.status === "recording";
  const href = live ? "/record" : `/session/?id=${session.id}`;

  async function download(event: React.MouseEvent) {
    event.preventDefault();
    const audio = await db.audio.get(session.id);
    if (!audio) {
      toast.error("Audio non disponibile per questa sessione.");
      return;
    }
    await saveBlob(audio.blob, audioFileName(session, audio.mimeType));
  }

  return (
    <Card className="relative flex-row items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/40">
      <div className="grid w-14 shrink-0 justify-items-center rounded-lg border bg-background/50 py-1.5 leading-none">
        <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          {format(date, "MMM", { locale: it })}
        </span>
        <span className="text-2xl font-semibold">{format(date, "d")}</span>
        <span className="text-[10px] text-muted-foreground">{format(date, "yyyy")}</span>
      </div>
      <div className="min-w-0 flex-1">
        <Link href={href} className="font-semibold after:absolute after:inset-0 hover:underline">
          <span className="line-clamp-1">{session.title}</span>
        </Link>
        <p className="text-sm text-muted-foreground capitalize">{format(date, "EEEE", { locale: it })}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{formatDuration(session.durationMs)}</span>
          <span>{session.lines.length} battute</span>
          {session.audioSize ? <span>{formatBytes(session.audioSize)}</span> : null}
          {live && (
            <Badge variant="destructive" className="h-4">
              In registrazione
            </Badge>
          )}
          {session.status === "interrupted" && (
            <Badge variant="secondary" className="h-4">
              Recuperata
            </Badge>
          )}
        </div>
      </div>
      <AvatarStack characters={cast} max={5} className="hidden sm:flex" />
      {!live && (
        <Button
          variant="ghost"
          size="icon"
          className="relative z-10"
          onClick={(e) => void download(e)}
          aria-label={`Scarica l'audio di ${session.title}`}
        >
          <Download />
        </Button>
      )}
    </Card>
  );
}
