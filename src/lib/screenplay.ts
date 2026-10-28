import { countWords, formatLongDate, formatTimestamp, sameSpeakers } from "./format";
import type { Character, Session } from "./types";

export interface ScreenplayEntry {
  key: string;
  t: number;
  text: string;
  speakerIds: string[];
  /** id della frase salvata; assente per i turni senza trascrizione */
  lineId?: string;
}

export interface ScreenplayBlock {
  key: string;
  speakerIds: string[];
  start: number;
  end: number;
  entries: ScreenplayEntry[];
}

/** Sotto questa durata un turno senza testo è quasi certamente un click di passaggio. */
const MIN_SILENT_TURN_MS = 1500;

/**
 * Costruisce la sceneggiatura: le frasi trascritte raggruppate per chi parla,
 * più un segnaposto per ogni turno rimasto senza testo (così si vede comunque
 * chi ha parlato e quando, e si può ascoltare o scrivere a mano la battuta).
 */
export function buildScreenplay(session: Session): ScreenplayBlock[] {
  const entries: ScreenplayEntry[] = session.lines.map((l) => ({
    key: l.id,
    t: l.t,
    text: l.text,
    speakerIds: l.speakerIds,
    lineId: l.id,
  }));

  for (const turn of session.turns) {
    if (turn.end - turn.start < MIN_SILENT_TURN_MS) continue;
    const covered = session.lines.some(
      (l) => l.t >= turn.start - 1000 && l.t < turn.end && sameSpeakers(l.speakerIds, turn.speakerIds),
    );
    if (!covered) {
      entries.push({ key: `turn-${turn.start}`, t: turn.start, text: "", speakerIds: turn.speakerIds });
    }
  }

  entries.sort((a, b) => a.t - b.t);

  const blocks: ScreenplayBlock[] = [];
  for (const entry of entries) {
    const last = blocks.at(-1);
    if (last && sameSpeakers(last.speakerIds, entry.speakerIds)) {
      last.entries.push(entry);
    } else {
      blocks.push({ key: entry.key, speakerIds: entry.speakerIds, start: entry.t, end: entry.t, entries: [entry] });
    }
  }
  blocks.forEach((block, i) => {
    block.end = blocks[i + 1]?.start ?? Math.max(session.durationMs, block.start);
  });
  return blocks;
}

export function speakerNames(ids: string[], characters: Map<string, Character>): string {
  if (!ids.length) return "Non assegnato";
  return ids.map((id) => characters.get(id)?.name ?? "Sconosciuto").join(", ");
}

function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && current.length + word.length + 1 > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const PAGE = 64;
const center = (s: string) => `${" ".repeat(Math.max(0, Math.floor((PAGE - s.length) / 2)))}${s}`;

/** Sceneggiatura in testo semplice, impaginata come un copione. */
export function screenplayToText(session: Session, characters: Map<string, Character>): string {
  const out: string[] = [];
  out.push(center(session.title.toUpperCase()), center(formatLongDate(session.date)), "");
  const cast = session.participantIds.map((id) => characters.get(id)?.name).filter(Boolean);
  if (cast.length) out.push(`PERSONAGGI: ${cast.join(", ")}`, "");
  out.push("=".repeat(PAGE), "");
  for (const block of buildScreenplay(session)) {
    const name = speakerNames(block.speakerIds, characters).toUpperCase();
    out.push(`[${formatTimestamp(block.start)}]`);
    wrap(name, 40).forEach((l) => out.push(center(l)));
    if (block.speakerIds.length > 1) out.push(center("(discussione)"));
    for (const entry of block.entries) {
      const text = entry.text || "(parte non trascritta)";
      wrap(text, 44).forEach((l) => out.push(`          ${l}`));
    }
    out.push("");
  }
  return out.join("\n");
}

export function screenplayToMarkdown(session: Session, characters: Map<string, Character>): string {
  const out: string[] = [`# ${session.title}`, "", `*${formatLongDate(session.date)}*`, ""];
  for (const block of buildScreenplay(session)) {
    const name = speakerNames(block.speakerIds, characters).toUpperCase();
    const tag = block.speakerIds.length > 1 ? " *(discussione)*" : "";
    out.push(`**${name}**${tag} · \`${formatTimestamp(block.start)}\``, "");
    const text = block.entries.map((e) => e.text || "_(parte non trascritta)_").join(" ");
    out.push(`> ${text}`, "");
  }
  return out.join("\n");
}

export interface SpeakerStat {
  id: string;
  talkMs: number;
  turns: number;
  words: number;
  lines: number;
}

/** Tempo di parola, turni e parole per personaggio (le discussioni contano per tutti). */
export function speakerStats(session: Session): SpeakerStat[] {
  const stats = new Map<string, SpeakerStat>();
  const get = (id: string) => {
    let s = stats.get(id);
    if (!s) {
      s = { id, talkMs: 0, turns: 0, words: 0, lines: 0 };
      stats.set(id, s);
    }
    return s;
  };
  for (const turn of session.turns) {
    for (const id of turn.speakerIds) {
      const s = get(id);
      s.talkMs += turn.end - turn.start;
      s.turns += 1;
    }
  }
  for (const line of session.lines) {
    for (const id of line.speakerIds) {
      const s = get(id);
      s.words += countWords(line.text);
      s.lines += 1;
    }
  }
  return [...stats.values()].sort((a, b) => b.talkMs - a.talkMs || b.words - a.words);
}
