export type Gender = "m" | "f";

/** master = chi conduce, pc = personaggio del party, npc = comparsa/PNG */
export type CharacterKind = "master" | "pc" | "npc";

export interface Character {
  id: string;
  kind: CharacterKind;
  name: string;
  playerName?: string;
  /** id razza (vedi races.ts) oppure "master" per l'avatar del master */
  raceId: string;
  gender: Gender;
  className?: string;
  /** foto caricata dall'utente, ridimensionata e salvata come data URL */
  photo?: string;
  /** slot colore della palette personaggi (-1 = neutro) */
  colorSlot: number;
  order: number;
  createdAt: number;
  /** nascosto dal party ma ancora referenziato da sessioni passate */
  archived?: boolean;
}

/** Intervallo in cui uno o più personaggi stanno parlando (ms dall'inizio dell'audio). */
export interface Turn {
  speakerIds: string[];
  start: number;
  end: number;
}

/** Frase trascritta, attribuita ai personaggi selezionati in quel momento. */
export interface TranscriptLine {
  id: string;
  t: number;
  text: string;
  speakerIds: string[];
  edited?: boolean;
}

export type SessionStatus = "recording" | "completed" | "interrupted";

export interface Session {
  id: string;
  title: string;
  /** data di gioco, formato YYYY-MM-DD */
  date: string;
  createdAt: number;
  updatedAt: number;
  status: SessionStatus;
  durationMs: number;
  participantIds: string[];
  turns: Turn[];
  lines: TranscriptLine[];
  notes?: string;
  language: string;
  transcription: "live" | "none";
  audioMimeType?: string;
  audioSize?: number;
  /** quando l'audio è stato scaricato l'ultima volta (finché manca, esiste solo nel browser) */
  audioSavedAt?: number;
}

export interface SessionAudio {
  sessionId: string;
  blob: Blob;
  mimeType: string;
}

/** Pezzi di audio salvati durante la registrazione, per recuperarla in caso di crash. */
export interface AudioChunk {
  id?: number;
  sessionId: string;
  seq: number;
  blob: Blob;
}

export interface Setting {
  key: string;
  value: unknown;
}
