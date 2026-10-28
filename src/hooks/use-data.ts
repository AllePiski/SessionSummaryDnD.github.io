"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { getRecordingEngine, IDLE_ENGINE_STATE } from "@/lib/recording-engine";
import type { Character } from "@/lib/types";

/** Personaggi attivi ordinati (undefined mentre carica). */
export function useCharacters(includeArchived = false) {
  return useLiveQuery(async () => {
    const all = await db.characters.orderBy("order").toArray();
    return includeArchived ? all : all.filter((c) => !c.archived);
  }, [includeArchived]);
}

/** Tutti i personaggi (anche archiviati) indicizzati per id. */
export function useCharacterMap(): Map<string, Character> {
  const all = useCharacters(true);
  return useMemo(() => new Map((all ?? []).map((c) => [c.id, c])), [all]);
}

export function useSessions() {
  return useLiveQuery(async () => {
    const all = await db.sessions.toArray();
    return all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, []);
}

/** La sessione, null se non esiste, undefined mentre carica. */
export function useSession(id: string | null) {
  return useLiveQuery(async () => (id ? ((await db.sessions.get(id)) ?? null) : null), [id]);
}

export function useSessionAudio(id: string | null) {
  return useLiveQuery(async () => (id ? ((await db.audio.get(id)) ?? null) : null), [id]);
}

export function useSetting<T>(key: string, fallback: T): T {
  const row = useLiveQuery(() => db.settings.get(key), [key]);
  return row ? (row.value as T) : fallback;
}

export function useRecording() {
  const engine = getRecordingEngine();
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot, () => IDLE_ENGINE_STATE);
  return { state, engine };
}
