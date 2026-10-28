/**
 * Trascrizione dal vivo con la Web Speech API (Chrome, Edge, Safari).
 * Il riconoscimento si interrompe da solo dopo pause lunghe o errori di rete:
 * qui viene riavviato automaticamente finché la registrazione è attiva.
 */

interface SpeechAlternative {
  transcript: string;
}
interface SpeechResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechAlternative;
}
interface SpeechResultEvent {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [index: number]: SpeechResult };
}
interface SpeechErrorEvent {
  readonly error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export type SpeechStatus = "unsupported" | "off" | "listening" | "paused" | "error";

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getCtor() !== null;
}

export const SPEECH_LANGUAGES = [
  { value: "it-IT", label: "Italiano" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Español" },
  { value: "fr-FR", label: "Français" },
  { value: "de-DE", label: "Deutsch" },
  { value: "pt-PT", label: "Português" },
];

interface TranscriberOptions {
  lang: string;
  /** chiave univoca della frase, testo corrente, true se definitivo */
  onResult(key: string, text: string, isFinal: boolean): void;
  onStatus(status: SpeechStatus, message?: string): void;
}

const MAX_CONSECUTIVE_FAILURES = 8;

export class LiveTranscriber {
  private rec: SpeechRecognitionLike | null = null;
  private wanted = false;
  private generation = 0;
  private failures = 0;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly opts: TranscriberOptions) {}

  start() {
    this.wanted = true;
    this.failures = 0;
    if (!this.rec) this.spawn();
  }

  /** Ferma l'ascolto; eventuali risultati definitivi in arrivo vengono comunque consegnati. */
  stop(status: SpeechStatus = "paused") {
    this.wanted = false;
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = null;
    const rec = this.rec;
    this.rec = null;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // già fermo
      }
    }
    this.opts.onStatus(status);
  }

  /** Riavvia subito se l'ascolto si era fermato (es. al ritorno sulla scheda). */
  kick() {
    if (this.wanted && !this.rec) {
      if (this.restartTimer) clearTimeout(this.restartTimer);
      this.restartTimer = null;
      this.spawn();
    }
  }

  private spawn() {
    const Ctor = getCtor();
    if (!Ctor) {
      this.opts.onStatus("unsupported");
      return;
    }
    const rec = new Ctor();
    const gen = ++this.generation;
    rec.lang = this.opts.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      if (this.rec === rec) this.opts.onStatus("listening");
    };
    rec.onresult = (event) => {
      this.failures = 0;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        this.opts.onResult(`${gen}:${i}`, text, result.isFinal);
      }
    };
    rec.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed" ||
        event.error === "language-not-supported"
      ) {
        this.wanted = false;
        this.opts.onStatus(
          "error",
          event.error === "language-not-supported"
            ? "Lingua non supportata dal riconoscimento vocale."
            : "Il browser non consente il riconoscimento vocale su questa pagina.",
        );
        return;
      }
      this.failures++;
      this.opts.onStatus(
        "error",
        event.error === "network"
          ? "Servizio di trascrizione non raggiungibile, nuovo tentativo…"
          : `Errore di trascrizione (${event.error}), nuovo tentativo…`,
      );
    };
    rec.onend = () => {
      if (this.rec !== rec) return;
      this.rec = null;
      if (!this.wanted) return;
      if (this.failures >= MAX_CONSECUTIVE_FAILURES) {
        this.wanted = false;
        this.opts.onStatus("error", "Trascrizione non disponibile: l'audio continua a essere registrato.");
        return;
      }
      const delay = this.failures === 0 ? 150 : Math.min(500 * 2 ** this.failures, 8000);
      this.restartTimer = setTimeout(() => {
        this.restartTimer = null;
        if (this.wanted && !this.rec) this.spawn();
      }, delay);
    };

    this.rec = rec;
    try {
      rec.start();
    } catch {
      this.rec = null;
      this.failures++;
      this.restartTimer = setTimeout(() => {
        this.restartTimer = null;
        if (this.wanted && !this.rec) this.spawn();
      }, 1000);
    }
  }
}
