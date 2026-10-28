import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

/** 3725000 → "1:02:05", 65000 → "1:05" */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

/** Sempre con le ore: "00:01:05" (per sceneggiature ed export). */
export function formatTimestamp(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** 3725000 → "1 h 2 min", 65000 → "1 min 5 s" */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  if (m > 0) return s > 0 && m < 10 ? `${m} min ${s} s` : `${m} min`;
  return `${s} s`;
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDate(iso: string): Date {
  return parseISO(iso);
}

/** "Mercoledì 28 ottobre 2026" (in italiano i mesi restano minuscoli) */
export function formatLongDate(iso: string): string {
  const text = format(parseISO(iso), "EEEE d MMMM yyyy", { locale: it });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "28 ott 2026" */
export function formatShortDate(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy", { locale: it });
}

export function defaultSessionTitle(iso: string): string {
  return `Sessione del ${format(parseISO(iso), "d MMMM yyyy", { locale: it })}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function sameSpeakers(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
