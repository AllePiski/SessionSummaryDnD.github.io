"use client";

import { useEffect, useMemo, useRef } from "react";
import { MessageSquareText } from "lucide-react";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { characterColor } from "@/lib/colors";
import { formatClock, sameSpeakers } from "@/lib/format";
import { speakerNames } from "@/lib/screenplay";
import type { Character, TranscriptLine } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 160;

interface Group {
  key: string;
  speakerIds: string[];
  t: number;
  texts: string[];
}

/** Trascrizione in diretta, raggruppata per personaggio. */
export function LiveTranscript({
  lines,
  interim,
  characters,
  enabled,
}: {
  lines: TranscriptLine[];
  interim: { text: string; speakerIds: string[] } | null;
  characters: Map<string, Character>;
  enabled: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  const groups = useMemo(() => {
    const out: Group[] = [];
    for (const line of lines.slice(-MAX_VISIBLE)) {
      const last = out.at(-1);
      if (last && sameSpeakers(last.speakerIds, line.speakerIds)) last.texts.push(line.text);
      else out.push({ key: line.id, speakerIds: line.speakerIds, t: line.t, texts: [line.text] });
    }
    return out;
  }, [lines]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [groups, interim]);

  const interimJoins = interim && groups.length > 0 && sameSpeakers(groups.at(-1)!.speakerIds, interim.speakerIds);

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => {
        const el = e.currentTarget;
        stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      }}
      className="h-full overflow-y-auto px-4 py-3"
      aria-live="polite"
    >
      {groups.length === 0 && !interim && (
        <div className="grid h-full place-items-center py-10 text-center text-sm text-muted-foreground">
          <div className="grid justify-items-center gap-2">
            <MessageSquareText className="size-8 opacity-50" />
            {enabled ? (
              <p>Le battute compariranno qui mentre parlate.</p>
            ) : (
              <p>
                Trascrizione non attiva: vengono registrati
                <br />
                l&apos;audio e i turni di parola.
              </p>
            )}
          </div>
        </div>
      )}
      <ol className="grid gap-4">
        {groups.map((g, i) => (
          <li key={g.key}>
            <GroupHeader ids={g.speakerIds} t={g.t} characters={characters} />
            <p className="mt-1 pl-9 text-sm leading-relaxed">
              {g.texts.join(" ")}
              {interimJoins && i === groups.length - 1 && (
                <span className="text-muted-foreground italic"> {interim!.text}…</span>
              )}
            </p>
          </li>
        ))}
        {interim && !interimJoins && (
          <li>
            <GroupHeader ids={interim.speakerIds} characters={characters} />
            <p className="mt-1 pl-9 text-sm text-muted-foreground italic">{interim.text}…</p>
          </li>
        )}
      </ol>
    </div>
  );
}

function GroupHeader({ ids, t, characters }: { ids: string[]; t?: number; characters: Map<string, Character> }) {
  const first = characters.get(ids[0]);
  return (
    <div className="flex items-center gap-2">
      <span className="relative">
        <CharacterAvatar character={first} className={cn("size-7", !first && "opacity-50")} />
        {ids.length > 1 && (
          <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-muted text-[9px] font-semibold ring-2 ring-card">
            {ids.length}
          </span>
        )}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        {ids.map((id) => (
          <span key={id} className="size-2 shrink-0 rounded-full" style={{ background: characterColor(characters.get(id)) }} />
        ))}
        <span className="truncate">{speakerNames(ids, characters)}</span>
      </span>
      {t !== undefined && <span className="ml-auto text-[11px] text-muted-foreground tabular">{formatClock(t)}</span>}
    </div>
  );
}
