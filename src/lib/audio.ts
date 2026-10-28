import type { Session } from "./types";
import { defaultSessionTitle } from "./format";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

export function isRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

/** Livello del segnale 0..1 (scala in dB, da -60 a -5 dBFS) per i VU meter. */
export function analyserLevel(analyser: AnalyserNode, buffer: Float32Array<ArrayBuffer>): number {
  analyser.getFloatTimeDomainData(buffer);
  let sum = 0;
  for (const v of buffer) sum += v * v;
  const rms = Math.sqrt(sum / buffer.length);
  const db = 20 * Math.log10(rms + 1e-8);
  return Math.max(0, Math.min(1, (db + 60) / 55));
}

export function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

function extensionFor(mime: string): string {
  if (mime.includes("mp4") || mime.includes("aac")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

function sanitize(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Nome file basato sulla data di gioco: "Sessione 2026-10-28 - La cripta.webm" */
export function sessionFileBase(session: Pick<Session, "date" | "title">): string {
  const custom = session.title && session.title !== defaultSessionTitle(session.date);
  return sanitize(custom ? `Sessione ${session.date} - ${session.title}` : `Sessione ${session.date}`);
}

export function audioFileName(session: Pick<Session, "date" | "title">, mime: string): string {
  return `${sessionFileBase(session)}.${extensionFor(mime)}`;
}

interface SaveFilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<{
    createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>;
  }>;
}

/**
 * Salva un file in locale. Dove il browser lo permette (Chrome/Edge) apre
 * "Salva con nome" per scegliere la cartella, altrimenti scarica il file.
 */
export async function saveBlob(blob: Blob, filename: string): Promise<"saved" | "cancelled"> {
  const w = window as unknown as SaveFilePickerWindow;
  if (typeof w.showSaveFilePicker === "function") {
    const ext = filename.split(".").pop() ?? "";
    const mime = (blob.type || "application/octet-stream").split(";")[0];
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: ext.toUpperCase(), accept: { [mime]: [`.${ext}`] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return "saved";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // altrimenti si ripiega sul download classico
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "saved";
}

export function describeMicError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Permesso al microfono negato. Abilitalo dalle impostazioni del sito nel browser.";
    }
    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
      return "Nessun microfono trovato. Collegane uno e riprova.";
    }
    if (error.name === "NotReadableError") {
      return "Il microfono è già in uso da un'altra applicazione.";
    }
  }
  return "Impossibile avviare il microfono.";
}
