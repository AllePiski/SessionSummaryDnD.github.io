"use client";

import { useEffect, useReducer } from "react";
import { useRecording } from "@/hooks/use-data";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Cronometro della registrazione: si aggiorna da solo senza ri-renderizzare la pagina. */
export function ElapsedTime({ className }: { className?: string }) {
  const { state, engine } = useRecording();
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const running = state.status === "recording";

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running]);

  const ms = state.status === "idle" ? 0 : engine.elapsed();
  return <span className={cn("tabular", className)}>{formatClock(ms)}</span>;
}
