"use client";

import { useEffect, useReducer } from "react";
import { useRecordingStatus } from "@/hooks/use-data";
import { getRecordingEngine } from "@/lib/recording-engine";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Cronometro della registrazione: si aggiorna da solo senza ri-renderizzare la pagina. */
export function ElapsedTime({ className }: { className?: string }) {
  const status = useRecordingStatus();
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const running = status === "recording";

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running]);

  const ms = status === "idle" ? 0 : getRecordingEngine().elapsed();
  return <span className={cn("tabular", className)}>{formatClock(ms)}</span>;
}
