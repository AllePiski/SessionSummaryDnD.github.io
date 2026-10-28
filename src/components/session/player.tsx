"use client";

import { createContext, useCallback, useContext, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PlayerState {
  playing: boolean;
  currentMs: number;
  durationMs: number;
  rate: number;
  /** i comandi principali sono visibili (altrimenti compare il mini-player) */
  controlsInView: boolean;
}

interface PlayerActions {
  ready: boolean;
  seek: (ms: number, play?: boolean) => void;
  skip: (deltaMs: number) => void;
  toggle: () => void;
  setRate: (rate: number) => void;
  /** callback ref per sapere se i comandi principali sono a schermo */
  observeControls: (el: HTMLElement | null) => void;
}

// Stato e azioni in due contesti: chi deve solo comandare l'audio (es. i
// blocchi della sceneggiatura) non si ri-renderizza a ogni avanzamento.
const PlayerStateContext = createContext<PlayerState | null>(null);
const PlayerActionsContext = createContext<PlayerActions | null>(null);

export function usePlayerState(): PlayerState {
  const state = useContext(PlayerStateContext);
  if (!state) throw new Error("usePlayerState va usato dentro <PlayerProvider>");
  return state;
}

export function usePlayerActions(): PlayerActions {
  const actions = useContext(PlayerActionsContext);
  if (!actions) throw new Error("usePlayerActions va usato dentro <PlayerProvider>");
  return actions;
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  // anche pulsanti e slider: Spazio e frecce hanno già un loro significato lì
  return (
    !!el &&
    (el.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(el.tagName) ||
      el.getAttribute("role") === "slider")
  );
}

export function PlayerProvider({
  blob,
  durationMs,
  children,
}: {
  blob: Blob | null | undefined;
  durationMs: number;
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [rate, setRateState] = useState(1);
  const [controlsInView, setControlsInView] = useState(true);

  // l'URL del file audio nasce e muore con il blob (niente effetti collaterali durante il render)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !blob) return;
    const url = URL.createObjectURL(blob);
    audio.src = url;
    return () => {
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  const seek = useCallback(
    (ms: number, play = false) => {
      const audio = audioRef.current;
      if (!audio) return;
      const clamped = Math.min(Math.max(0, ms), durationMs || ms);
      audio.currentTime = clamped / 1000;
      setCurrentMs(clamped);
      if (play) void audio.play().catch(() => {});
    },
    [durationMs],
  );

  const skip = useCallback(
    (deltaMs: number) => {
      const audio = audioRef.current;
      if (audio) seek(audio.currentTime * 1000 + deltaMs);
    },
    [seek],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  }, []);

  const setRate = useCallback((next: number) => {
    if (audioRef.current) audioRef.current.playbackRate = next;
    setRateState(next);
  }, []);

  const observeControls = useCallback((el: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el) return;
    observerRef.current = new IntersectionObserver(([entry]) => setControlsInView(entry.isIntersecting));
    observerRef.current.observe(el);
  }, []);

  // Spazio = play/pausa, ←/→ = ±5 s (con Maiusc ±30 s), fuori dai campi di testo
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (!blob || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
    if (document.querySelector("[role=dialog], [role=alertdialog]")) return;
    if (event.key === " ") {
      event.preventDefault();
      toggle();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const step = event.shiftKey ? 30_000 : 5_000;
      skip(event.key === "ArrowLeft" ? -step : step);
    }
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const actions = useMemo<PlayerActions>(
    () => ({ ready: !!blob, seek, skip, toggle, setRate, observeControls }),
    [blob, seek, skip, toggle, setRate, observeControls],
  );
  const state = useMemo<PlayerState>(
    () => ({ playing, currentMs, durationMs, rate, controlsInView }),
    [playing, currentMs, durationMs, rate, controlsInView],
  );

  return (
    <PlayerActionsContext.Provider value={actions}>
      <PlayerStateContext.Provider value={state}>
        <audio
          ref={audioRef}
          preload="metadata"
          className="hidden"
          onTimeUpdate={(e) => setCurrentMs(e.currentTarget.currentTime * 1000)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onLoadedMetadata={(e) => {
            e.currentTarget.playbackRate = rate;
          }}
        />
        {children}
      </PlayerStateContext.Provider>
    </PlayerActionsContext.Provider>
  );
}

const RATES = [0.75, 1, 1.25, 1.5, 2];

export function PlayerControls() {
  const { playing, currentMs, durationMs, rate } = usePlayerState();
  const { ready, skip, toggle, setRate, observeControls } = usePlayerActions();
  return (
    <div ref={observeControls} className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-lg" disabled={!ready} onClick={() => skip(-10_000)} aria-label="Indietro di 10 secondi">
          <RotateCcw />
        </Button>
        <PlayButton playing={playing} disabled={!ready} onClick={toggle} />
        <Button variant="ghost" size="icon-lg" disabled={!ready} onClick={() => skip(10_000)} aria-label="Avanti di 10 secondi">
          <RotateCw />
        </Button>
      </div>
      <div className="flex min-w-48 flex-1 items-center gap-3">
        <span className="w-14 text-right text-sm tabular">{formatClock(currentMs)}</span>
        <SeekBar className="flex-1" />
        <span className="w-14 text-sm text-muted-foreground tabular">{formatClock(durationMs)}</span>
      </div>
      <RateMenu rate={rate} disabled={!ready} onChange={setRate} />
    </div>
  );
}

/** Comandi ridotti, fissi in basso, quando quelli principali sono fuori schermo. */
export function MiniPlayer({ label }: { label?: string }) {
  const { playing, currentMs, durationMs, rate, controlsInView } = usePlayerState();
  const { ready, skip, toggle, setRate } = usePlayerActions();
  if (!ready || controlsInView) return null;
  return (
    <div className="no-print fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border bg-popover/95 py-1.5 pr-3 pl-1.5 shadow-lg backdrop-blur">
      <Button variant="ghost" size="icon" onClick={() => skip(-10_000)} aria-label="Indietro di 10 secondi">
        <RotateCcw />
      </Button>
      <PlayButton playing={playing} onClick={toggle} />
      <Button variant="ghost" size="icon" onClick={() => skip(10_000)} aria-label="Avanti di 10 secondi">
        <RotateCw />
      </Button>
      <span className="text-sm tabular">
        {formatClock(currentMs)} <span className="text-muted-foreground">/ {formatClock(durationMs)}</span>
      </span>
      {label && <span className="hidden max-w-48 truncate text-sm font-medium sm:inline">· {label}</span>}
      <RateMenu rate={rate} onChange={setRate} />
    </div>
  );
}

function PlayButton({ playing, disabled, onClick }: { playing: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <Button size="icon-lg" className="size-11 rounded-full" disabled={disabled} onClick={onClick} aria-label={playing ? "Pausa" : "Riproduci"}>
      {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 translate-x-px fill-current" />}
    </Button>
  );
}

function RateMenu({ rate, disabled, onChange }: { rate: number; disabled?: boolean; onChange: (rate: number) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="tabular" aria-label={`Velocità di riproduzione: ${rate}×`}>
          {rate}×
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={String(rate)} onValueChange={(v) => onChange(Number(v))}>
          {RATES.map((r) => (
            <DropdownMenuRadioItem key={r} value={String(r)}>
              {r}× {r === 1 && "(normale)"}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Barra di avanzamento: valori in secondi e tempo leggibile per gli screen reader. */
function SeekBar({ className }: { className?: string }) {
  const { currentMs, durationMs } = usePlayerState();
  const { ready, seek } = usePlayerActions();
  const seconds = Math.floor(Math.min(currentMs, durationMs) / 1000);
  return (
    <SliderPrimitive.Root
      value={[seconds]}
      max={Math.max(1, Math.floor(durationMs / 1000))}
      step={1}
      disabled={!ready}
      onValueChange={([v]) => seek(v * 1000)}
      className={cn("relative flex h-5 touch-none items-center select-none data-disabled:opacity-50", className)}
    >
      <SliderPrimitive.Track className="relative h-1 grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label="Posizione nell'audio"
        aria-valuetext={`${formatClock(seconds * 1000)} di ${formatClock(durationMs)}`}
        className="block size-3.5 rounded-full border border-ring bg-white shadow ring-ring/50 transition-[box-shadow] outline-none hover:ring-3 focus-visible:ring-3"
      />
    </SliderPrimitive.Root>
  );
}
