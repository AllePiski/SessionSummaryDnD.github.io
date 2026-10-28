import Dexie, { type EntityTable } from "dexie";
import type { AudioChunk, Character, Session, SessionAudio, Setting } from "./types";

class SessionDB extends Dexie {
  characters!: EntityTable<Character, "id">;
  sessions!: EntityTable<Session, "id">;
  audio!: EntityTable<SessionAudio, "sessionId">;
  chunks!: EntityTable<AudioChunk, "id">;
  settings!: EntityTable<Setting, "key">;

  constructor() {
    super("dnd-session-recorder");
    this.version(1).stores({
      characters: "id, kind, order, createdAt",
      sessions: "id, date, createdAt, status",
      audio: "sessionId",
      chunks: "++id, sessionId, [sessionId+seq]",
      settings: "key",
    });
  }
}

export const db = new SessionDB();
