"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * VU meter del microfono. Legge il livello a ogni frame e aggiorna
 * direttamente il DOM, così non provoca render React a 60 fps.
 */
export function LevelMeter({
  getLevel,
  active,
  bars = 20,
  className,
}: {
  getLevel: () => number;
  active: boolean;
  bars?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cells = Array.from(root.children) as HTMLElement[];
    if (!active) {
      cells.forEach((c) => (c.dataset.on = "false"));
      return;
    }
    let raf = 0;
    let smooth = 0;
    const loop = () => {
      const level = getLevel();
      smooth = Math.max(level, smooth * 0.88);
      const lit = Math.round(smooth * bars);
      cells.forEach((c, i) => (c.dataset.on = String(i < lit)));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, getLevel, bars]);

  return (
    <div ref={ref} className={cn("flex h-6 items-end gap-[2px]", className)} aria-hidden>
      {Array.from({ length: bars }, (_, i) => {
        const pos = i / (bars - 1);
        const tone =
          pos > 0.9
            ? "data-[on=true]:bg-[#d03b3b]"
            : pos > 0.72
              ? "data-[on=true]:bg-[#fab219]"
              : "data-[on=true]:bg-primary";
        return (
          <span
            key={i}
            data-on="false"
            className={cn("w-[3px] rounded-[1px] bg-(--track) transition-colors duration-75", tone)}
            style={{ height: `${35 + pos * 65}%` }}
          />
        );
      })}
    </div>
  );
}
