"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { getRecordingEngine, IDLE_ENGINE_STATE, type EngineState } from "@/lib/recording-engine";
import { setSetting } from "@/lib/repo";
import { DEFAULT_LANG, DEFAULT_TRANSCRIBE, SETTING_LANG, SETTING_TRANSCRIBE } from "@/lib/settings";
import { isSpeechRecognitionSupported } from "@/lib/transcriber";
import { useClientValue } from "./use-client-value";
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

/**
 * Una parte dello stato del motore di registrazione. Il componente si
 * ri-renderizza solo quando cambia il valore scelto: il selettore deve
 * restituire un campo dello stato o un valore primitivo, mai un oggetto nuovo.
 */
export function useRecordingState<T>(select: (state: EngineState) => T): T {
  const engine = getRecordingEngine();
  return useSyncExternalStore(
    engine.subscribe,
    () => select(engine.getSnapshot()),
    () => select(IDLE_ENGINE_STATE),
  );
}

export function useRecordingStatus() {
  return useRecordingState((s) => s.status);
}

/**
 * Opzione "riconoscimento vocale": salvata nelle impostazioni e applicata
 * subito anche alla registrazione in corso.
 */
export function useTranscription() {
  const enabled = useSetting(SETTING_TRANSCRIBE, DEFAULT_TRANSCRIBE);
  const lang = useSetting(SETTING_LANG, DEFAULT_LANG);
  const supported = useClientValue(isSpeechRecognitionSupported, true);
  const setEnabled = useCallback(
    (value: boolean) => {
      void setSetting(SETTING_TRANSCRIBE, value);
      getRecordingEngine().setTranscription(value, lang);
    },
    [lang],
  );
  const setLang = useCallback((value: string) => {
    void setSetting(SETTING_LANG, value);
    getRecordingEngine().setLanguage(value);
  }, []);
  return { enabled: enabled && supported, supported, lang, setEnabled, setLang };
}
