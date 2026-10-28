"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { formatClock } from "@/lib/format";

interface PlayerState {
  playing: boolean;
  currentMs: number;
  durationMs: number;
  rate: number;
}

interface PlayerActions {
  ready: boolean;
  seek: (ms: number, play?: boolean) => void;
  toggle: () => void;
  setRate: (rate: number) => void;
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

function useObjectUrl(blob: Blob | null | undefined) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return url;
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
  const src = useObjectUrl(blob);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [rate, setRateState] = useState(1);

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

  const actions = useMemo<PlayerActions>(() => ({ ready: !!src, seek, toggle, setRate }), [src, seek, toggle, setRate]);
  const state = useMemo<PlayerState>(
    () => ({ playing, currentMs, durationMs, rate }),
    [playing, currentMs, durationMs, rate],
  );

  return (
    <PlayerActionsContext.Provider value={actions}>
      <PlayerStateContext.Provider value={state}>
        {src && (
          <audio
            ref={audioRef}
            src={src}
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
        )}
        {children}
      </PlayerStateContext.Provider>
    </PlayerActionsContext.Provider>
  );
}

const RATES = [0.75, 1, 1.25, 1.5, 2];

export function PlayerControls() {
  const { playing, currentMs, durationMs, rate } = usePlayerState();
  const { ready, seek, toggle, setRate } = usePlayerActions();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" disabled={!ready} onClick={() => seek(currentMs - 10_000)} aria-label="Indietro di 10 secondi">
          <RotateCcw />
        </Button>
        <Button size="icon-lg" className="size-11 rounded-full" disabled={!ready} onClick={toggle} aria-label={playing ? "Pausa" : "Riproduci"}>
          {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 translate-x-px fill-current" />}
        </Button>
        <Button variant="ghost" size="icon" disabled={!ready} onClick={() => seek(currentMs + 10_000)} aria-label="Avanti di 10 secondi">
          <RotateCw />
        </Button>
      </div>
      <div className="flex min-w-48 flex-1 items-center gap-3">
        <span className="w-14 text-right text-sm tabular">{formatClock(currentMs)}</span>
        <Slider
          value={[Math.min(currentMs, durationMs)]}
          max={Math.max(durationMs, 1)}
          step={1000}
          disabled={!ready}
          onValueChange={([v]) => seek(v)}
          aria-label="Posizione nell'audio"
          className="flex-1"
        />
        <span className="w-14 text-sm text-muted-foreground tabular">{formatClock(durationMs)}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={!ready} className="tabular" aria-label="Velocità di riproduzione">
            {rate}×
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={String(rate)} onValueChange={(v) => setRate(Number(v))}>
            {RATES.map((r) => (
              <DropdownMenuRadioItem key={r} value={String(r)}>
                {r}× {r === 1 && "(normale)"}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
