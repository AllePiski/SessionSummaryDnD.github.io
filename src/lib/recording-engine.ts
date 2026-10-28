import fixWebmDuration from "fix-webm-duration";
import { db } from "./db";
import { analyserLevel, describeMicError, pickMimeType } from "./audio";
import { sameSpeakers, uid } from "./format";
import { LiveTranscriber, isSpeechRecognitionSupported, type SpeechStatus } from "./transcriber";
import type { TranscriptLine, Turn } from "./types";

/** `save-failed`: registrazione finita ma salvataggio non riuscito (si può riprovare o scaricare l'audio). */
type EngineStatus = "idle" | "starting" | "recording" | "paused" | "stopping" | "save-failed";

/** Come si è chiusa l'ultima registrazione (per avvisare se non l'ha fermata l'utente). */
export interface LastStop {
  sessionId: string;
  reason: "user" | "mic-ended";
  durationMs: number;
}

export interface EngineState {
  status: EngineStatus;
  sessionId: string | null;
  title: string;
  /** data di gioco, YYYY-MM-DD */
  date: string;
  /** Date.now() dell'inizio della pausa in corso */
  pausedAt: number | null;
  lastStop: LastStop | null;
  participantIds: string[];
  activeSpeakerIds: string[];
  /** turni già chiusi */
  turns: Turn[];
  /** turno in corso (senza fine) */
  currentTurn: { speakerIds: string[]; start: number } | null;
  lines: TranscriptLine[];
  interim: { text: string; speakerIds: string[] } | null;
  speech: SpeechStatus;
  speechMessage?: string;
  mimeType: string;
}

interface StartOptions {
  sessionId: string;
  title: string;
  date: string;
  participantIds: string[];
  initialSpeakerIds: string[];
  language: string;
  transcribe: boolean;
  deviceId?: string;
}

/** durata di ogni pezzo di audio salvato durante la registrazione */
export const TIMESLICE_MS = 4000;
const SAVE_THROTTLE_MS = 2500;
const HEARTBEAT_MS = 5000;

function initialState(): EngineState {
  return {
    status: "idle",
    sessionId: null,
    title: "",
    date: "",
    pausedAt: null,
    lastStop: null,
    participantIds: [],
    activeSpeakerIds: [],
    turns: [],
    currentTurn: null,
    lines: [],
    interim: null,
    speech: "off",
    mimeType: "",
  };
}

function polish(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return t;
  const capital = t.charAt(0).toLocaleUpperCase("it-IT") + t.slice(1);
  return /[.!?…:;]$/.test(capital) ? capital : `${capital}.`;
}

interface Phrase {
  start: number;
  last: number;
}

/** Dati finali calcolati al primo tentativo di stop (riusati se si riprova il salvataggio). */
interface Finalized {
  sessionId: string;
  durationMs: number;
  lines: TranscriptLine[];
  turns: Turn[];
  reason: LastStop["reason"];
  blob?: Blob;
}

/**
 * Motore di registrazione: tiene microfono, MediaRecorder, trascrizione e
 * timeline dei turni di parola. Vive fuori da React così la registrazione
 * continua anche cambiando pagina dentro l'app.
 */
class RecordingEngine {
  private state: EngineState = initialState();
  private listeners = new Set<() => void>();

  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private seq = 0;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private levelBuffer: Float32Array<ArrayBuffer> | null = null;
  private transcriber: LiveTranscriber | null = null;
  private phrases = new Map<string, Phrase>();
  private accumulated = 0;
  private runningSince: number | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private language = "it-IT";
  /** battute cambiate dall'ultimo salvataggio (i turni si salvano sempre: sono pochi) */
  private linesDirty = false;
  private finalized: Finalized | null = null;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  private set(patch: Partial<EngineState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  isActive() {
    return this.state.status === "recording" || this.state.status === "paused";
  }

  /** ms di audio registrato (le pause non contano) */
  elapsed(): number {
    return this.accumulated + (this.runningSince !== null ? performance.now() - this.runningSince : 0);
  }

  /** livello del microfono 0..1 per il VU meter */
  level = (): number => {
    if (!this.analyser) return 0;
    this.levelBuffer ??= new Float32Array(this.analyser.fftSize);
    return analyserLevel(this.analyser, this.levelBuffer);
  };

  async start(opts: StartOptions) {
    if (this.state.status !== "idle") throw new Error("C'è già una registrazione in corso.");
    this.set({
      ...initialState(),
      status: "starting",
      sessionId: opts.sessionId,
      title: opts.title,
      date: opts.date,
      participantIds: opts.participantIds,
    });
    this.language = opts.language;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: opts.deviceId ? { exact: opts.deviceId } : undefined,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (error) {
      this.set(initialState());
      throw new Error(describeMicError(error));
    }

    const mimeType = pickMimeType();
    try {
      this.recorder = createRecorder(this.stream, mimeType);
      this.chunks = [];
      this.seq = 0;
      this.recorder.ondataavailable = (event) => this.onData(event.data);
      this.recorder.start(TIMESLICE_MS);
    } catch {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
      this.recorder = null;
      this.set(initialState());
      throw new Error("Questo browser non riesce a registrare dal microfono scelto.");
    }
    this.stream.getAudioTracks().forEach((track) => {
      // microfono scollegato: si salva quello che c'è e si avvisa l'utente
      track.onended = () => {
        if (this.isActive()) void this.stop("mic-ended").catch(() => {});
      };
    });

    try {
      this.audioCtx = new AudioContext();
      const source = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      source.connect(this.analyser);
    } catch {
      this.analyser = null;
    }

    this.accumulated = 0;
    this.runningSince = performance.now();
    const initial = opts.initialSpeakerIds;
    this.set({
      status: "recording",
      mimeType: this.recorder.mimeType || mimeType,
      activeSpeakerIds: initial,
      currentTurn: initial.length ? { speakerIds: initial, start: 0 } : null,
    });

    if (opts.transcribe) this.setTranscription(true, opts.language);

    void this.acquireWakeLock();
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("beforeunload", this.onBeforeUnload);
    this.heartbeat = setInterval(() => this.scheduleSave(true), HEARTBEAT_MS);
    this.scheduleSave(true);
  }

  setSpeakers(ids: string[]) {
    if (!this.isActive()) return;
    if (sameSpeakers(ids, this.state.activeSpeakerIds)) return;
    const now = this.elapsed();
    const { currentTurn } = this.state;
    const turns =
      currentTurn && now > currentTurn.start ? [...this.state.turns, { ...currentTurn, end: now }] : this.state.turns;
    this.set({
      activeSpeakerIds: ids,
      turns,
      currentTurn: ids.length ? { speakerIds: ids, start: now } : null,
    });
    this.scheduleSave();
  }

  /** Cambia la lingua del riconoscimento vocale (lo riavvia se è acceso). */
  setLanguage(language: string) {
    this.language = language;
    if (!this.transcriber) return;
    this.setTranscription(false, language);
    this.setTranscription(true, language);
  }

  /** Accende o spegne il riconoscimento vocale, anche a registrazione in corso. */
  setTranscription(enabled: boolean, language = this.language) {
    if (!this.isActive()) return;
    this.language = language;
    if (!enabled) {
      this.transcriber?.stop("off");
      this.transcriber = null;
      this.phrases.clear();
      this.set({ interim: null, speech: "off", speechMessage: undefined });
      return;
    }
    if (this.transcriber) return;
    if (!isSpeechRecognitionSupported()) {
      this.set({ speech: "unsupported" });
      return;
    }
    const transcriber: LiveTranscriber = new LiveTranscriber({
      lang: language,
      onResult: this.onSpeechResult,
      // un riconoscitore già spento non deve più cambiare lo stato
      onStatus: (speech, speechMessage) => {
        if (this.transcriber === transcriber) this.set({ speech, speechMessage });
      },
    });
    this.transcriber = transcriber;
    if (this.state.status === "recording") transcriber.start();
    else this.set({ speech: "paused" });
    if (this.state.sessionId) void db.sessions.update(this.state.sessionId, { transcription: "live" });
  }

  addParticipant(id: string) {
    if (this.state.participantIds.includes(id)) return;
    this.set({ participantIds: [...this.state.participantIds, id] });
    this.scheduleSave();
  }

  pause() {
    if (this.state.status !== "recording") return;
    this.recorder?.pause();
    this.accumulated = this.elapsed();
    this.runningSince = null;
    this.transcriber?.stop("paused");
    this.set({ status: "paused", interim: null, pausedAt: Date.now() });
    this.scheduleSave(true);
  }

  resume() {
    if (this.state.status !== "paused") return;
    this.recorder?.resume();
    this.runningSince = performance.now();
    this.transcriber?.start();
    this.set({ status: "recording", pausedAt: null });
  }

  /** L'audio non salvato dopo un errore di salvataggio, da scaricare a mano. */
  unsavedAudio(): Blob | null {
    if (this.state.status !== "save-failed") return null;
    return this.finalized?.blob ?? new Blob(this.chunks, { type: this.state.mimeType });
  }

  /** Dimentica l'ultimo stop dopo averlo notificato. */
  clearLastStop() {
    if (this.state.lastStop) this.set({ lastStop: null });
  }

  /**
   * Chiude la sessione e salva audio + trascrizione; ritorna l'id della sessione.
   * Se il salvataggio fallisce lo stato diventa `save-failed` e si può richiamare
   * `stop()` per riprovare (i dati restano in memoria).
   */
  async stop(reason: LastStop["reason"] = "user"): Promise<string | null> {
    if (!this.isActive() && this.state.status !== "save-failed") return null;
    const final = this.finalized ?? this.finalize(reason);
    this.set({ status: "stopping", lines: final.lines, turns: final.turns, currentTurn: null, interim: null });

    try {
      if (!final.blob) {
        const raw = await this.stopRecorder();
        final.blob = raw;
        if (raw.type.includes("webm")) {
          try {
            final.blob = await fixWebmDuration(raw, final.durationMs, { logger: false });
          } catch {
            // si tiene il file così com'è
          }
        }
        this.releaseDevices();
      }
      const blob = final.blob;
      const mimeType = blob.type || this.state.mimeType || "audio/webm";
      await db.transaction("rw", db.sessions, db.audio, db.chunks, async () => {
        await db.audio.put({ sessionId: final.sessionId, blob, mimeType });
        await db.sessions.update(final.sessionId, {
          status: "completed",
          durationMs: final.durationMs,
          turns: final.turns.filter((t) => t.end - t.start >= 250),
          lines: final.lines,
          participantIds: this.state.participantIds,
          audioMimeType: mimeType,
          audioSize: blob.size,
          updatedAt: Date.now(),
        });
        await db.chunks.where("sessionId").equals(final.sessionId).delete();
      });
    } catch (error) {
      this.set({ status: "save-failed" });
      throw error;
    }

    this.teardown();
    this.finalized = null;
    this.set({
      ...initialState(),
      lastStop: { sessionId: final.sessionId, reason: final.reason, durationMs: final.durationMs },
    });
    return final.sessionId;
  }

  /** Ferma il cronometro e chiude turni e battute (una volta sola per sessione). */
  private finalize(reason: LastStop["reason"]): Finalized {
    const durationMs = Math.round(this.elapsed());
    this.accumulated = durationMs;
    this.runningSince = null;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
    this.transcriber?.stop("off");
    this.transcriber = null;

    // il testo ancora "provvisorio" viene tenuto come frase definitiva
    let lines = this.state.lines;
    if (this.state.interim?.text) {
      lines = [
        ...lines,
        {
          id: uid(),
          t: Math.max(0, durationMs - 2000),
          text: polish(this.state.interim.text),
          speakerIds: this.state.interim.speakerIds,
        },
      ];
    }
    const turns = [...this.state.turns];
    if (this.state.currentTurn && durationMs > this.state.currentTurn.start) {
      turns.push({ ...this.state.currentTurn, end: durationMs });
    }
    this.finalized = { sessionId: this.state.sessionId!, durationMs, lines, turns, reason };
    return this.finalized;
  }

  private onData(blob: Blob) {
    if (!blob || blob.size === 0) return;
    this.chunks.push(blob);
    const sessionId = this.state.sessionId;
    if (sessionId) {
      db.chunks.add({ sessionId, seq: this.seq++, blob }).catch(() => {
        // la copia di sicurezza è best-effort: l'audio resta comunque in memoria
      });
    }
  }

  private stopRecorder(): Promise<Blob> {
    const rec = this.recorder;
    const type = rec?.mimeType || this.state.mimeType;
    return new Promise((resolve) => {
      if (!rec || rec.state === "inactive") {
        resolve(new Blob(this.chunks, { type }));
        return;
      }
      rec.addEventListener("stop", () => resolve(new Blob(this.chunks, { type })), { once: true });
      rec.stop();
    });
  }

  private onSpeechResult = (key: string, text: string, isFinal: boolean) => {
    const now = this.elapsed();
    let phrase = this.phrases.get(key);
    if (!phrase) {
      phrase = { start: now, last: now };
      this.phrases.set(key, phrase);
    }
    if (!isFinal) {
      phrase.last = now;
      const interimText = text.trim();
      this.set({ interim: interimText ? { text: interimText, speakerIds: this.state.activeSpeakerIds } : null });
      return;
    }

    this.phrases.delete(key);
    const clean = text.trim();
    if (!clean) {
      this.set({ interim: null });
      return;
    }
    const hadInterim = phrase.last > phrase.start;
    const words = clean.split(/\s+/).length;
    const start = hadInterim ? phrase.start : Math.max(0, now - Math.min(words * 380, 8000));
    const end = hadInterim ? phrase.last : now;
    const line: TranscriptLine = {
      id: uid(),
      t: Math.round(start),
      text: polish(clean),
      speakerIds: this.dominantSpeakers(start, end),
    };
    this.linesDirty = true;
    this.set({ lines: [...this.state.lines, line], interim: null });
    this.scheduleSave();
  };

  /**
   * Chi stava parlando durante la frase: vince il turno con più
   * sovrapposizione, così un click in ritardo sul nuovo personaggio
   * non "ruba" la frase precedente (e viceversa).
   */
  private dominantSpeakers(start: number, end: number): string[] {
    const { turns, currentTurn } = this.state;
    const spans: Turn[] = currentTurn
      ? [...turns, { ...currentTurn, end: Math.max(end, this.elapsed()) }]
      : turns;
    let best: string[] = [];
    let bestOverlap = 0;
    for (const span of spans) {
      const overlap = Math.min(end, span.end) - Math.max(start, span.start);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        best = span.speakerIds;
      }
    }
    if (bestOverlap > 0) return best;
    const at = spans.find((s) => start >= s.start && start < s.end);
    return at ? at.speakerIds : [];
  }

  private scheduleSave(immediate = false) {
    if (this.saveTimer) {
      if (!immediate) return;
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(
      () => {
        this.saveTimer = null;
        void this.persist();
      },
      immediate ? 0 : SAVE_THROTTLE_MS,
    );
  }

  private async persist() {
    const s = this.state;
    if (!s.sessionId || (s.status !== "recording" && s.status !== "paused")) return;
    const now = Math.round(this.elapsed());
    const turns = s.currentTurn ? [...s.turns, { ...s.currentTurn, end: now }] : s.turns;
    // le battute (la parte pesante) si riscrivono solo se sono cambiate
    const lines = this.linesDirty ? { lines: s.lines } : {};
    this.linesDirty = false;
    await db.sessions.update(s.sessionId, {
      ...lines,
      turns,
      participantIds: s.participantIds,
      durationMs: now,
      audioMimeType: s.mimeType,
      updatedAt: Date.now(),
    });
  }

  private async acquireWakeLock() {
    try {
      this.wakeLock = (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      this.wakeLock = null;
    }
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === "visible" && this.isActive()) {
      void this.acquireWakeLock();
      if (this.state.status === "recording") this.transcriber?.kick();
    }
  };

  private onBeforeUnload = (event: BeforeUnloadEvent) => {
    const status = this.state.status;
    if (this.isActive() || status === "stopping" || status === "save-failed") event.preventDefault();
  };

  /** Spegne microfono, analisi del livello e blocco dello schermo (idempotente). */
  private releaseDevices() {
    this.stream?.getTracks().forEach((t) => {
      t.onended = null;
      t.stop();
    });
    this.stream = null;
    this.analyser = null;
    this.levelBuffer = null;
    void this.audioCtx?.close().catch(() => {});
    this.audioCtx = null;
    void this.wakeLock?.release().catch(() => {});
    this.wakeLock = null;
  }

  private teardown() {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
    this.releaseDevices();
    this.recorder = null;
    this.chunks = [];
    this.phrases.clear();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("beforeunload", this.onBeforeUnload);
  }
}

function createRecorder(stream: MediaStream, mimeType: string): MediaRecorder {
  try {
    return new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
  } catch {
    return new MediaRecorder(stream);
  }
}

let engine: RecordingEngine | null = null;

export function getRecordingEngine(): RecordingEngine {
  engine ??= new RecordingEngine();
  return engine;
}

export const IDLE_ENGINE_STATE = initialState();
