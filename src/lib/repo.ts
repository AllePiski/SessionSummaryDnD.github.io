import fixWebmDuration from "fix-webm-duration";
import { db } from "./db";
import { nextColorSlot } from "./colors";
import { TIMESLICE_MS } from "./recording-engine";
import { sameSpeakers, uid } from "./format";
import type { Character, CharacterKind, Gender, Session, TranscriptLine } from "./types";

export interface CharacterDraft {
  name: string;
  playerName?: string;
  raceId: string;
  gender: Gender;
  className?: string;
  photo?: string;
}

function clean(draft: CharacterDraft): CharacterDraft {
  return {
    name: draft.name.trim(),
    playerName: draft.playerName?.trim() || undefined,
    raceId: draft.raceId,
    gender: draft.gender,
    className: draft.className || undefined,
    photo: draft.photo || undefined,
  };
}

export async function createParty(master: CharacterDraft, members: CharacterDraft[]) {
  await db.transaction("rw", db.characters, async () => {
    const existing = await db.characters.toArray();
    const now = Date.now();
    let order = existing.reduce((max, c) => Math.max(max, c.order), 0);
    const rows: Character[] = [];
    // un master archiviato appartiene a un party eliminato: non va riutilizzato
    const currentMaster = existing.find((c) => c.kind === "master" && !c.archived);
    if (currentMaster) {
      await db.characters.update(currentMaster.id, clean(master));
    } else {
      rows.push({ ...clean(master), id: uid(), kind: "master", colorSlot: -1, order: 0, createdAt: now });
    }
    const pool = [...existing];
    for (const member of members) {
      const row: Character = {
        ...clean(member),
        id: uid(),
        kind: "pc",
        colorSlot: nextColorSlot([...pool, ...rows]),
        order: ++order,
        createdAt: now,
      };
      rows.push(row);
    }
    await db.characters.bulkAdd(rows);
  });
}

export async function addCharacter(draft: CharacterDraft, kind: CharacterKind): Promise<Character> {
  return db.transaction("rw", db.characters, async () => {
    const all = await db.characters.toArray();
    const row: Character = {
      ...clean(draft),
      id: uid(),
      kind,
      colorSlot: kind === "pc" ? nextColorSlot(all) : -1,
      order: all.reduce((max, c) => Math.max(max, c.order), 0) + 1,
      createdAt: Date.now(),
    };
    await db.characters.add(row);
    return row;
  });
}

export async function updateCharacter(id: string, draft: CharacterDraft, kind?: CharacterKind) {
  await db.transaction("rw", db.characters, async () => {
    const current = await db.characters.get(id);
    if (!current) return;
    const patch: Partial<Character> = { ...clean(draft), archived: false };
    if (kind && kind !== current.kind && current.kind !== "master") {
      patch.kind = kind;
      if (kind === "pc") patch.colorSlot = nextColorSlot((await db.characters.toArray()).filter((c) => c.id !== id));
      else patch.colorSlot = -1;
    }
    await db.characters.update(id, patch);
  });
}

/** Elimina il personaggio; se compare in sessioni passate viene solo nascosto. */
export async function removeCharacter(id: string) {
  await db.transaction("rw", db.characters, db.sessions, async () => {
    const used = await db.sessions.filter((s) => s.participantIds.includes(id)).count();
    if (used > 0) await db.characters.update(id, { archived: true });
    else await db.characters.delete(id);
  });
}

/**
 * Elimina l'intero party (master, personaggi e PNG). Senza `withSessions` i
 * personaggi che compaiono in sessioni registrate vengono solo nascosti, così
 * archivio e sceneggiature mantengono i nomi. Lo storico dei dadi si azzera.
 */
export async function deleteParty({ withSessions }: { withSessions: boolean }) {
  await db.transaction("rw", [db.characters, db.sessions, db.audio, db.chunks, db.settings], async () => {
    if (withSessions) {
      await Promise.all([db.sessions.clear(), db.audio.clear(), db.chunks.clear(), db.characters.clear()]);
    } else {
      const sessions = await db.sessions.toArray();
      const used = new Set(
        sessions.flatMap((s) => [
          ...s.participantIds,
          ...s.turns.flatMap((t) => t.speakerIds),
          ...s.lines.flatMap((l) => l.speakerIds),
        ]),
      );
      const characters = await db.characters.toArray();
      await db.characters.bulkDelete(characters.filter((c) => !used.has(c.id)).map((c) => c.id));
      await Promise.all(
        characters.filter((c) => used.has(c.id) && !c.archived).map((c) => db.characters.update(c.id, { archived: true })),
      );
    }
    await db.settings.delete("dice");
  });
}

export async function createSession(input: {
  date: string;
  title: string;
  participantIds: string[];
  language: string;
  transcription: "live" | "none";
}): Promise<Session> {
  const now = Date.now();
  const session: Session = {
    id: uid(),
    title: input.title,
    date: input.date,
    createdAt: now,
    updatedAt: now,
    status: "recording",
    durationMs: 0,
    participantIds: input.participantIds,
    turns: [],
    lines: [],
    language: input.language,
    transcription: input.transcription,
  };
  await db.sessions.add(session);
  return session;
}

export async function deleteSession(id: string) {
  await db.transaction("rw", db.sessions, db.audio, db.chunks, async () => {
    await db.sessions.delete(id);
    await db.audio.delete(id);
    await db.chunks.where("sessionId").equals(id).delete();
  });
}

export async function updateSessionInfo(id: string, patch: Pick<Partial<Session>, "title" | "date" | "notes">) {
  await db.sessions.update(id, { ...patch, updatedAt: Date.now() });
}

/** Modifica le frasi della sceneggiatura in modo atomico. */
async function editLines(id: string, edit: (session: Session) => Partial<Session>) {
  await db.transaction("rw", db.sessions, async () => {
    const session = await db.sessions.get(id);
    if (!session) return;
    await db.sessions.update(id, { ...edit(session), updatedAt: Date.now() });
  });
}

export function setLineText(sessionId: string, lineId: string, text: string) {
  return editLines(sessionId, (s) => ({
    lines: s.lines.map((l) => (l.id === lineId ? { ...l, text: text.trim(), edited: true } : l)),
  }));
}

export function deleteLine(sessionId: string, lineId: string) {
  return editLines(sessionId, (s) => ({ lines: s.lines.filter((l) => l.id !== lineId) }));
}

export function addLine(sessionId: string, line: Omit<TranscriptLine, "id">) {
  return editLines(sessionId, (s) => ({
    lines: [...s.lines, { ...line, id: uid(), edited: true }].sort((a, b) => a.t - b.t),
  }));
}

/**
 * Riassegna un blocco della sceneggiatura ad altri personaggi: aggiorna sia
 * le frasi sia i turni della timeline, così statistiche e grafico restano coerenti.
 */
export function reassignSpeakers(
  sessionId: string,
  range: { start: number; end: number },
  from: string[],
  to: string[],
) {
  return editLines(sessionId, (s) => {
    const inRange = (t: number) => t >= range.start && t < range.end;
    const participantIds = [...s.participantIds];
    for (const id of to) if (!participantIds.includes(id)) participantIds.push(id);
    return {
      participantIds,
      lines: s.lines.map((l) => (inRange(l.t) && sameSpeakers(l.speakerIds, from) ? { ...l, speakerIds: to } : l)),
      turns: s.turns.map((t) =>
        t.start >= range.start - 500 && t.start < range.end && sameSpeakers(t.speakerIds, from)
          ? { ...t, speakerIds: to }
          : t,
      ),
    };
  });
}

/**
 * Sessioni rimaste "in registrazione" senza aggiornamenti recenti (tab chiusa,
 * crash, batteria scarica): ricostruisce l'audio dai pezzi salvati.
 */
export async function recoverInterruptedSessions(activeSessionId: string | null): Promise<Session[]> {
  const stale = await db.sessions
    .where("status")
    .equals("recording")
    .filter((s) => s.id !== activeSessionId && Date.now() - s.updatedAt > 45_000)
    .toArray();
  const recovered: Session[] = [];
  for (const session of stale) {
    const chunks = await db.chunks.where("sessionId").equals(session.id).sortBy("seq");
    const mimeType = session.audioMimeType || chunks[0]?.blob.type || "audio/webm";
    // l'ultimo salvataggio della sessione può essere più vecchio dell'ultimo pezzo di audio
    const durationMs = Math.max(session.durationMs, chunks.length * TIMESLICE_MS);
    let blob: Blob | null = chunks.length ? new Blob(chunks.map((c) => c.blob), { type: mimeType }) : null;
    if (blob && mimeType.includes("webm") && durationMs > 0) {
      try {
        blob = await fixWebmDuration(blob, durationMs, { logger: false });
      } catch {
        // si tiene il file così com'è
      }
    }
    await db.transaction("rw", db.sessions, db.audio, db.chunks, async () => {
      if (blob) await db.audio.put({ sessionId: session.id, blob, mimeType });
      await db.sessions.update(session.id, {
        status: "interrupted",
        durationMs,
        audioMimeType: blob ? mimeType : undefined,
        audioSize: blob?.size,
        updatedAt: Date.now(),
      });
      await db.chunks.where("sessionId").equals(session.id).delete();
    });
    recovered.push(session);
  }
  return recovered;
}

export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // non supportato: nessun problema
  }
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value });
}
