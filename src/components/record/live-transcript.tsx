"use client";

import { memo, useMemo } from "react";
import { MessageSquareText } from "lucide-react";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { useStickToBottom } from "@/hooks/use-stick-to-bottom";
import { characterColor } from "@/lib/colors";
import { formatClock, formatDuration, sameSpeakers } from "@/lib/format";
import { speakerNames } from "@/lib/screenplay";
import type { Character, TranscriptLine, Turn } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 160;

interface Group {
  key: string;
  speakerIds: string[];
  t: number;
  lines: TranscriptLine[];
}

/** Trascrizione in diretta, raggruppata per personaggio. */
export function LiveTranscript({
  lines,
  interim,
  characters,
}: {
  lines: TranscriptLine[];
  interim: { text: string; speakerIds: string[] } | null;
  characters: Map<string, Character>;
}) {
  const groups = useMemo(() => {
    const out: Group[] = [];
    for (const line of lines.slice(-MAX_VISIBLE)) {
      const last = out.at(-1);
      if (last && sameSpeakers(last.speakerIds, line.speakerIds)) last.lines.push(line);
      else out.push({ key: line.id, speakerIds: line.speakerIds, t: line.t, lines: [line] });
    }
    return out;
  }, [lines]);

  const last = groups.at(-1);
  const interimJoins = !!interim && !!last && sameSpeakers(last.speakerIds, interim.speakerIds);
  const { ref, onScroll } = useStickToBottom<HTMLDivElement>(`${lines.length}:${interim?.text ?? ""}`);

  return (
    <div ref={ref} onScroll={onScroll} className="h-full overflow-y-auto px-4 py-3">
      {groups.length === 0 && !interim && <EmptyState>Le battute compariranno qui mentre parlate.</EmptyState>}
      <ol role="log" aria-label="Trascrizione dal vivo" className="grid gap-4">
        {groups.map((g, i) => (
          <TranscriptGroup
            key={g.key}
            group={g}
            characters={characters}
            interimText={interimJoins && i === groups.length - 1 ? interim.text : undefined}
          />
        ))}
        {interim && !interimJoins && (
          <li aria-hidden>
            <GroupHeader ids={interim.speakerIds} characters={characters} />
            <p className="mt-1 pl-9 text-sm text-muted-foreground italic">{interim.text}…</p>
          </li>
        )}
      </ol>
    </div>
  );
}

/** Un gruppo di battute dello stesso personaggio: solo l'ultimo riceve il testo provvisorio. */
const TranscriptGroup = memo(function TranscriptGroup({
  group,
  characters,
  interimText,
}: {
  group: Group;
  characters: Map<string, Character>;
  interimText?: string;
}) {
  return (
    <li>
      <GroupHeader ids={group.speakerIds} t={group.t} characters={characters} />
      <p className="mt-1 pl-9 text-sm leading-relaxed">
        {group.lines.map((l) => (
          <span key={l.id}>{l.text} </span>
        ))}
        {interimText && (
          <span aria-hidden className="text-muted-foreground italic">
            {interimText}…
          </span>
        )}
      </p>
    </li>
  );
});

/** Registro dei turni di parola (quando il riconoscimento vocale è spento). */
export function TurnLog({
  turns,
  currentTurn,
  characters,
}: {
  turns: Turn[];
  currentTurn: { speakerIds: string[]; start: number } | null;
  characters: Map<string, Character>;
}) {
  const visible = turns.filter((t) => t.end - t.start >= 1000).slice(-MAX_VISIBLE);
  const { ref, onScroll } = useStickToBottom<HTMLDivElement>(`${visible.length}:${currentTurn?.start}`);

  return (
    <div ref={ref} onScroll={onScroll} className="h-full overflow-y-auto px-4 py-3">
      {visible.length === 0 && !currentTurn && (
        <EmptyState>
          Tocca chi sta parlando: qui compare
          <br />
          la sequenza dei turni di parola.
        </EmptyState>
      )}
      <ol className="grid gap-3">
        {visible.map((turn) => (
          <li key={turn.start}>
            <GroupHeader ids={turn.speakerIds} t={turn.start} characters={characters} />
            <p className="mt-0.5 pl-9 text-xs text-muted-foreground">
              {turn.speakerIds.length > 1 ? "Discussione · " : ""}
              {formatDuration(turn.end - turn.start)}
            </p>
          </li>
        ))}
        {currentTurn && (
          <li>
            <GroupHeader ids={currentTurn.speakerIds} t={currentTurn.start} characters={characters} />
            <p className="mt-0.5 flex items-center gap-1.5 pl-9 text-xs font-medium">
              <span className="rec-dot size-1.5 rounded-full bg-rec" /> Sta parlando
            </p>
          </li>
        )}
      </ol>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full place-items-center py-10 text-center text-sm text-muted-foreground">
      <div className="grid justify-items-center gap-2">
        <MessageSquareText className="size-8 opacity-50" />
        <p>{children}</p>
      </div>
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
