"use client";

import { useEffect, useId, useRef, useState } from "react";
import { rollDie } from "@/lib/dice";
import { cn } from "@/lib/utils";

interface Shape {
  outline: string;
  facets: string;
  /** posizione e corpo del numero nella faccia */
  text: { y: number; size: number };
}

function polygon(points: [number, number][]): string {
  return `M${points.map(([x, y]) => `${x} ${y}`).join(" L")} Z`;
}

const SHAPES: Record<number, Shape> = {
  4: {
    outline: polygon([[50, 6], [95, 88], [5, 88]]),
    facets: "M50 6 L50 62 M5 88 L50 62 M95 88 L50 62",
    text: { y: 76, size: 24 },
  },
  6: {
    outline: "M26 10 H74 Q90 10 90 26 V74 Q90 90 74 90 H26 Q10 90 10 74 V26 Q10 10 26 10 Z",
    facets: "M18 18 L28 28 M82 18 L72 28 M18 82 L28 72 M82 82 L72 72",
    text: { y: 51, size: 40 },
  },
  8: {
    outline: polygon([[50, 4], [96, 50], [50, 96], [4, 50]]),
    facets: "M4 50 L96 50",
    text: { y: 51, size: 30 },
  },
  10: {
    outline: polygon([[50, 4], [94, 42], [50, 96], [6, 42]]),
    facets: "M6 42 L50 60 L94 42 M50 60 L50 96",
    text: { y: 42, size: 26 },
  },
  12: {
    outline: polygon([[50, 5], [93.7, 36.8], [77, 88.2], [23, 88.2], [6.3, 36.8]]),
    facets: polygon([[50, 28], [71, 43.5], [63, 68], [37, 68], [29, 43.5]]),
    text: { y: 51, size: 24 },
  },
  20: {
    outline: polygon([[50, 3], [91, 26], [91, 74], [50, 97], [9, 74], [9, 26]]),
    facets:
      "M50 22 L79 70 L21 70 Z M50 22 L9 26 M50 22 L91 26 M50 22 L50 3 M79 70 L91 26 M79 70 L91 74 M79 70 L50 97 M21 70 L9 26 M21 70 L9 74 M21 70 L50 97",
    text: { y: 55, size: 22 },
  },
};

function shapeFor(sides: number): Shape {
  return SHAPES[sides === 100 ? 10 : sides] ?? SHAPES[20];
}

/** Disegno di un dado con il valore sulla faccia ("?" se non ancora tirato). */
export function DieFace({
  sides,
  value,
  color,
  icon = false,
  className,
}: {
  sides: number;
  value: number | null;
  color: string;
  /** solo la forma, senza numero (per icone e pulsanti) */
  icon?: boolean;
  className?: string;
}) {
  const id = `die${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const shape = shapeFor(sides);
  const label = value === null ? "?" : String(value);
  const size = label.length >= 3 ? shape.text.size * 0.72 : shape.text.size;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={icon ? undefined : "img"}
      aria-hidden={icon || undefined}
      aria-label={icon ? undefined : `d${sides}: ${label}`}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: `color-mix(in oklch, ${color} 70%, white)` }} />
          <stop offset="55%" style={{ stopColor: color }} />
          <stop offset="100%" style={{ stopColor: `color-mix(in oklch, ${color} 70%, black)` }} />
        </linearGradient>
      </defs>
      <path
        d={shape.outline}
        fill={`url(#${id}-g)`}
        style={{ stroke: `color-mix(in oklch, ${color} 55%, black)` }}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d={shape.facets} fill="none" stroke="white" strokeOpacity={0.28} strokeWidth={2} strokeLinejoin="round" />
      {!icon && (
        <text
          x={50}
          y={shape.text.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size}
          fontWeight={700}
          fill="white"
          stroke="rgba(0,0,0,.45)"
          strokeWidth={3}
          paintOrder="stroke"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {label}
        </text>
      )}
      {!icon && sides === 100 && (
        <text x={50} y={74} textAnchor="middle" fontSize={13} fontWeight={700} fill="white" fillOpacity={0.85}>
          %
        </text>
      )}
    </svg>
  );
}

/**
 * Dado che entra rotolando nel tappeto: traiettoria casuale, rimbalzo e
 * numeri che scorrono finché non si ferma sul risultato.
 */
export function RollingDie({
  sides,
  value,
  color,
  animate,
  delay,
  duration,
  highlight,
  discarded,
  className,
}: {
  sides: number;
  value: number;
  color: string;
  animate: boolean;
  delay: number;
  duration: number;
  highlight?: "max" | "min";
  /** tiro scartato (vantaggio/svantaggio): si spegne quando il dado si ferma */
  discarded?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(() => (animate ? rollDie(sides) : value));
  const [settled, setSettled] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const el = ref.current;
    const dx = -140 - Math.random() * 160;
    const dy = -60 - Math.random() * 120;
    const spin = (Math.random() > 0.5 ? 1 : -1) * (540 + Math.random() * 540);
    const animation = el?.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg) scale(.5)`, opacity: 0 },
        { transform: `translate(${dx * 0.2}px, ${-dy * 0.06}px) rotate(${spin * 0.3}deg) scale(1.06)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx * -0.04}px, -16px) rotate(${spin * 0.06}deg) scale(1)`, offset: 0.68 },
        { transform: `translate(0, 0) rotate(${spin * -0.015}deg) scale(1)`, offset: 0.85 },
        { transform: "none", offset: 1 },
      ],
      { duration, delay, easing: "cubic-bezier(.25,.75,.35,1)", fill: "backwards" },
    );
    const flicker = setInterval(() => setShown(rollDie(sides)), 75);
    const stop = setTimeout(() => {
      clearInterval(flicker);
      setShown(value);
      setSettled(true);
    }, delay + duration * 0.82);
    return () => {
      animation?.cancel();
      clearInterval(flicker);
      clearTimeout(stop);
    };
  }, [animate, delay, duration, sides, value]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-full drop-shadow-[0_6px_6px_rgba(0,0,0,.45)] transition-[filter,opacity,scale] duration-300",
        settled && discarded && "scale-90 opacity-35 grayscale",
        settled && highlight === "max" && "drop-shadow-[0_0_14px_rgba(255,214,90,.95)]",
        settled && highlight === "min" && "drop-shadow-[0_0_14px_rgba(240,62,62,.9)]",
        className,
      )}
    >
      <DieFace sides={sides} value={shown} color={color} className="size-full" />
    </div>
  );
}
