import { useId, type ReactNode } from "react";
import type { Gender } from "@/lib/types";

type HeadStyle = "oval" | "soft" | "round" | "square" | "dragon" | "cat" | "forged" | "goblin";
type EarStyle = "human" | "elf" | "halfelf" | "orc" | "goblin" | "fin" | "firbolg" | "cat" | "none";
type EyeStyle = "normal" | "glow" | "slit" | "beady" | "visor";
type BrowStyle = "normal" | "thin" | "heavy" | "ridge" | "none";
type NoseStyle = "small" | "button" | "gnome" | "broad" | "pointy" | "cat" | "firbolg" | "snout" | "none";
type MouthStyle = "smile" | "lips" | "stern" | "grin" | "cat" | "grille" | "dragon";
type HairStyle =
  | "short"
  | "swept"
  | "long"
  | "longStraight"
  | "braids"
  | "topknot"
  | "mohawk"
  | "ponytail"
  | "pigtails"
  | "curly"
  | "curlyLong"
  | "tuft"
  | "flame"
  | "flameLong"
  | "plates"
  | "crest"
  | "none";
type BeardStyle = "full" | "stubble" | "goatee" | "pointy" | "braided" | "none";
type Extra =
  | "tusks"
  | "smallTusks"
  | "horns"
  | "dragonHorns"
  | "halo"
  | "scales"
  | "markings"
  | "freckles"
  | "blush"
  | "whiskers"
  | "stripes"
  | "embers"
  | "gills"
  | "rivets"
  | "earring"
  | "warpaint";

/** Valore unico o diverso per genere. */
type G<T> = T | { m: T; f: T };

interface Spec {
  bg: G<[string, string]>;
  cloak: G<string>;
  trim: G<string>;
  skin: G<string>;
  shade: G<string>;
  hair: G<string>;
  hairStyle: G<HairStyle>;
  beard?: G<BeardStyle>;
  eyes: G<EyeStyle>;
  eyeColor: G<string>;
  ears: G<EarStyle>;
  head: G<HeadStyle>;
  nose: G<NoseStyle>;
  mouth: G<MouthStyle>;
  brows: G<BrowStyle>;
  extras?: G<Extra[]>;
  lip?: G<string>;
}

function pick<T>(value: G<T>, gender: Gender): T {
  if (value && typeof value === "object" && "m" in value && "f" in value) {
    return (value as { m: T; f: T })[gender];
  }
  return value as T;
}

const SPECS: Record<string, Spec> = {
  umano: {
    bg: ["#4a6fa5", "#1b2a44"],
    cloak: "#2d3f5f",
    trim: "#c9a45c",
    skin: { m: "#e3b48f", f: "#efc6a4" },
    shade: { m: "#c48f6b", f: "#d6a281" },
    hair: { m: "#4a2f1f", f: "#7a3f1f" },
    hairStyle: { m: "short", f: "long" },
    beard: { m: "stubble", f: "none" },
    eyes: "normal",
    eyeColor: "#5a3b20",
    ears: "human",
    head: { m: "oval", f: "soft" },
    nose: "small",
    mouth: { m: "smile", f: "lips" },
    brows: { m: "normal", f: "thin" },
    extras: { m: [], f: ["blush"] },
  },
  elfo: {
    bg: ["#3f8a63", "#123324"],
    cloak: "#24503b",
    trim: "#d7c48a",
    skin: "#f4dcc8",
    shade: "#d9b89f",
    hair: { m: "#e9d79e", f: "#f3e6b8" },
    hairStyle: { m: "longStraight", f: "long" },
    eyes: "normal",
    eyeColor: "#3c9a63",
    ears: "elf",
    head: { m: "oval", f: "soft" },
    nose: "small",
    mouth: { m: "smile", f: "lips" },
    brows: "thin",
    extras: { m: [], f: ["blush"] },
  },
  mezzelfo: {
    bg: ["#2f7f86", "#0f3236"],
    cloak: "#255a5f",
    trim: "#c9a45c",
    skin: "#e9c19c",
    shade: "#c99d78",
    hair: { m: "#6e4226", f: "#9a4a26" },
    hairStyle: { m: "swept", f: "long" },
    beard: { m: "stubble", f: "none" },
    eyes: "normal",
    eyeColor: "#8a7a32",
    ears: "halfelf",
    head: { m: "oval", f: "soft" },
    nose: "small",
    mouth: { m: "smile", f: "lips" },
    brows: { m: "normal", f: "thin" },
  },
  drow: {
    bg: ["#5b3a8a", "#1a0f2e"],
    cloak: "#2a1d40",
    trim: "#b9a7e6",
    skin: "#5a5778",
    shade: "#45425f",
    hair: "#ecebf5",
    hairStyle: { m: "longStraight", f: "long" },
    eyes: "normal",
    eyeColor: "#e2434f",
    ears: "elf",
    head: { m: "oval", f: "soft" },
    nose: "small",
    mouth: { m: "smile", f: "lips" },
    brows: "thin",
    lip: "#8a5f9a",
    extras: { m: [], f: ["earring"] },
  },
  nano: {
    bg: ["#9a5b2a", "#3a1f0c"],
    cloak: "#5e3b22",
    trim: "#c0c4c8",
    skin: "#dca47e",
    shade: "#bd8560",
    hair: { m: "#b4532a", f: "#9a3d1c" },
    hairStyle: { m: "short", f: "braids" },
    beard: { m: "full", f: "none" },
    eyes: "normal",
    eyeColor: "#4a74a8",
    ears: "human",
    head: "square",
    nose: { m: "gnome", f: "button" },
    mouth: { m: "smile", f: "lips" },
    brows: { m: "heavy", f: "normal" },
    extras: { m: [], f: ["blush", "earring"] },
  },
  halfling: {
    bg: ["#8a9a3a", "#2e3510"],
    cloak: "#5a6a2a",
    trim: "#d9b36a",
    skin: "#f1c59e",
    shade: "#d6a57d",
    hair: "#7a4a24",
    hairStyle: { m: "curly", f: "curlyLong" },
    eyes: "normal",
    eyeColor: "#6a8a3a",
    ears: "halfelf",
    head: "round",
    nose: "button",
    mouth: { m: "smile", f: "lips" },
    brows: { m: "normal", f: "thin" },
    extras: ["freckles", "blush"],
  },
  gnomo: {
    bg: ["#3a8fb0", "#123848"],
    cloak: "#2f6a85",
    trim: "#e3c06a",
    skin: "#f4d2b8",
    shade: "#dbb093",
    hair: { m: "#eeeeee", f: "#e26aa8" },
    hairStyle: { m: "tuft", f: "pigtails" },
    beard: { m: "pointy", f: "none" },
    eyes: "normal",
    eyeColor: "#2f8fc0",
    ears: "halfelf",
    head: "round",
    nose: "gnome",
    mouth: { m: "smile", f: "lips" },
    brows: { m: "normal", f: "thin" },
    extras: ["blush"],
  },
  orco: {
    bg: ["#8a3a22", "#2e1006"],
    cloak: "#4a3022",
    trim: "#9a9a9a",
    skin: "#7d9a3e",
    shade: "#5f7a2c",
    hair: "#1d1b19",
    hairStyle: { m: "topknot", f: "ponytail" },
    eyes: "normal",
    eyeColor: "#e8b830",
    ears: "orc",
    head: "square",
    nose: "broad",
    mouth: { m: "stern", f: "lips" },
    brows: "heavy",
    lip: "#4f6625",
    extras: { m: ["tusks", "warpaint"], f: ["tusks", "earring"] },
  },
  mezzorco: {
    bg: ["#5f6a52", "#20261a"],
    cloak: "#3d4436",
    trim: "#b08a52",
    skin: "#a3b07e",
    shade: "#879463",
    hair: "#2a2522",
    hairStyle: { m: "mohawk", f: "long" },
    eyes: "normal",
    eyeColor: "#b98a3a",
    ears: "orc",
    head: { m: "square", f: "soft" },
    nose: { m: "broad", f: "small" },
    mouth: { m: "stern", f: "lips" },
    brows: { m: "heavy", f: "normal" },
    lip: "#7a7f55",
    extras: ["smallTusks"],
  },
  goblin: {
    bg: ["#5a7a1f", "#1c2a08"],
    cloak: "#6a5530",
    trim: "#a08850",
    skin: "#93c24b",
    shade: "#73a034",
    hair: "#2a2a1f",
    hairStyle: { m: "none", f: "ponytail" },
    eyes: "beady",
    eyeColor: "#e8402a",
    ears: "goblin",
    head: "goblin",
    nose: "pointy",
    mouth: "grin",
    brows: "normal",
    extras: { m: [], f: ["earring"] },
  },
  hobgoblin: {
    bg: ["#9a2f2f", "#330c0c"],
    cloak: "#3a2828",
    trim: "#b8b8b8",
    skin: "#cc6a40",
    shade: "#a8522f",
    hair: "#1d1717",
    hairStyle: { m: "topknot", f: "ponytail" },
    eyes: "normal",
    eyeColor: "#f0c040",
    ears: "orc",
    head: "square",
    nose: "broad",
    mouth: { m: "stern", f: "lips" },
    brows: "heavy",
    lip: "#8f3f22",
  },
  tiefling: {
    bg: ["#8a1f45", "#2c0814"],
    cloak: "#3a1426",
    trim: "#d4a24a",
    skin: { m: "#c0424f", f: "#9a4fae" },
    shade: { m: "#9c3340", f: "#7d3d8f" },
    hair: { m: "#2a1430", f: "#1d0f26" },
    hairStyle: { m: "swept", f: "long" },
    beard: { m: "goatee", f: "none" },
    eyes: "glow",
    eyeColor: "#ffcf4a",
    ears: "halfelf",
    head: { m: "oval", f: "soft" },
    nose: "small",
    mouth: { m: "smile", f: "lips" },
    brows: "normal",
    lip: { m: "#6b1f2a", f: "#5a2266" },
    extras: ["horns"],
  },
  aasimar: {
    bg: ["#d8b45a", "#5f4512"],
    cloak: "#efe6cf",
    trim: "#c9a03a",
    skin: "#f6dfca",
    shade: "#dcbfa5",
    hair: { m: "#f2dc94", f: "#fff0c2" },
    hairStyle: { m: "short", f: "long" },
    eyes: "glow",
    eyeColor: "#fff4c8",
    ears: "human",
    head: { m: "oval", f: "soft" },
    nose: "small",
    mouth: { m: "smile", f: "lips" },
    brows: "thin",
    extras: ["halo"],
  },
  dragonide: {
    bg: { m: ["#a8432a", "#3a120a"], f: ["#2f6fb0", "#0e2440"] },
    cloak: { m: "#4a2a1e", f: "#1f3550" },
    trim: "#d4a24a",
    skin: { m: "#c4552f", f: "#3f86c8" },
    shade: { m: "#9e4224", f: "#2f6aa3" },
    hair: "#000000",
    hairStyle: "none",
    eyes: "slit",
    eyeColor: "#f5d142",
    ears: "none",
    head: "dragon",
    nose: "snout",
    mouth: "dragon",
    brows: "ridge",
    extras: ["dragonHorns", "scales"],
  },
  goliath: {
    bg: ["#5a6a7e", "#1b232d"],
    cloak: "#6b5040",
    trim: "#e3d6bd",
    skin: "#aab0b8",
    shade: "#8b929b",
    hair: "#2f2f2f",
    hairStyle: { m: "none", f: "ponytail" },
    eyes: "normal",
    eyeColor: "#4a86c0",
    ears: "human",
    head: "square",
    nose: "small",
    mouth: { m: "stern", f: "lips" },
    brows: "heavy",
    lip: "#7d838c",
    extras: ["markings"],
  },
  tabaxi: {
    bg: ["#b0702a", "#3e220a"],
    cloak: "#2c4a60",
    trim: "#d9b36a",
    skin: { m: "#d9a441", f: "#bcb5ad" },
    shade: { m: "#b5862f", f: "#9a938b" },
    hair: { m: "#7a5521", f: "#5f5a55" },
    hairStyle: "none",
    eyes: "slit",
    eyeColor: { m: "#8fd14f", f: "#4fc3d1" },
    ears: "cat",
    head: "cat",
    nose: "cat",
    mouth: "cat",
    brows: "none",
    extras: ["stripes", "whiskers"],
  },
  firbolg: {
    bg: ["#4f7a3a", "#1a2d12"],
    cloak: "#6b5536",
    trim: "#a8c27a",
    skin: "#a9b9d8",
    shade: "#8b9cc0",
    hair: { m: "#7a5a3a", f: "#5f7f3a" },
    hairStyle: { m: "longStraight", f: "braids" },
    beard: { m: "braided", f: "none" },
    eyes: "normal",
    eyeColor: "#5a8f3a",
    ears: "firbolg",
    head: { m: "oval", f: "soft" },
    nose: "firbolg",
    mouth: { m: "smile", f: "lips" },
    brows: "normal",
    lip: "#b07a92",
    extras: { m: [], f: ["blush"] },
  },
  genasi: {
    bg: ["#a8320f", "#300c02"],
    cloak: "#3a1a10",
    trim: "#ffb347",
    skin: "#d9673f",
    shade: "#b44f2c",
    hair: "#ff7a1f",
    hairStyle: { m: "flame", f: "flameLong" },
    eyes: "glow",
    eyeColor: "#ffe27a",
    ears: "halfelf",
    head: { m: "oval", f: "soft" },
    nose: "small",
    mouth: { m: "smile", f: "lips" },
    brows: "none",
    lip: "#8f2f12",
    extras: ["embers"],
  },
  tritone: {
    bg: ["#1f7a9a", "#08293a"],
    cloak: "#1d4e5e",
    trim: "#f0d9b5",
    skin: "#76bccd",
    shade: "#5a9eb0",
    hair: { m: "#1f4a6b", f: "#2a6f8f" },
    hairStyle: { m: "swept", f: "long" },
    eyes: "normal",
    eyeColor: "#1f5f8f",
    ears: "fin",
    head: { m: "oval", f: "soft" },
    nose: "small",
    mouth: { m: "smile", f: "lips" },
    brows: "normal",
    lip: "#3f7f9a",
    extras: ["gills"],
  },
  forgiato: {
    bg: ["#46525f", "#141a20"],
    cloak: "#5a6470",
    trim: "#c9a24a",
    skin: "#98a3ae",
    shade: "#6f7a86",
    hair: "#5b6470",
    hairStyle: { m: "crest", f: "plates" },
    eyes: "visor",
    eyeColor: "#5fd4ff",
    ears: "none",
    head: "forged",
    nose: "none",
    mouth: "grille",
    brows: "none",
    extras: ["rivets"],
  },
};

const MIRROR = "matrix(-1 0 0 1 120 0)";

/** Disegna il contenuto e la sua copia specchiata (lato destro del viso). */
function Sym({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <g transform={MIRROR}>{children}</g>
    </>
  );
}

function mix(hex: string, target: number, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(v + (target - v) * amount),
  );
  return `#${ch.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
const darken = (hex: string, amount: number) => mix(hex, 0, amount);
const lighten = (hex: string, amount: number) => mix(hex, 255, amount);

const HEADS: Record<HeadStyle, string> = {
  oval: "M40 53 C40 37 48 30 60 30 C72 30 80 37 80 53 C80 67 73 78 60 80 C47 78 40 67 40 53 Z",
  soft: "M41 53 C41 38 49 31 60 31 C71 31 79 38 79 53 C79 67 72 77 60 79 C48 77 41 67 41 53 Z",
  round: "M38 55 C38 39 47 31 60 31 C73 31 82 39 82 55 C82 69 73 79 60 79 C47 79 38 69 38 55 Z",
  square:
    "M38 51 C38 36 47 29 60 29 C73 29 82 36 82 51 C82 63 80 72 74 77 C69 81 51 81 46 77 C40 72 38 63 38 51 Z",
  dragon:
    "M40 50 C40 34 49 26 60 26 C71 26 80 34 80 50 C80 60 77 67 74 73 C71 81 66 85 60 85 C54 85 49 81 46 73 C43 67 40 60 40 50 Z",
  cat: "M38 54 C38 38 47 31 60 31 C73 31 82 38 82 54 C82 61 86 65 84 70 C79 72 74 78 60 80 C46 78 41 72 36 70 C34 65 38 61 38 54 Z",
  forged: "M41 42 L47 31 L73 31 L79 42 L80 58 L74 74 L60 81 L46 74 L40 58 Z",
  goblin: "M40 55 C40 41 48 33 60 33 C72 33 80 41 80 55 C80 68 72 77 60 77 C48 77 40 68 40 55 Z",
};

const EARS: Record<Exclude<EarStyle, "cat" | "none">, { outer: string; inner?: string }> = {
  human: { outer: "M42.5 52 C37.5 49.5 35 53.5 35.8 58 C36.6 62.5 39 64.5 42.5 63.5 Z", inner: "M41 55 C39 54.5 38.4 57 39.4 59.5" },
  elf: { outer: "M42 50 C36 47 30 40 24 29 C28 42 33 54 42 63 Z", inner: "M40 53 C35 49 31 43 28 36" },
  halfelf: { outer: "M42 50 C37 48 33 44 29.5 37 C31 48 35 56 42 63 Z", inner: "M40 53 C37 50 34.5 46 32.5 42" },
  orc: { outer: "M42 51 C38 49 35 46 32 41 C33 50 36 57 42 62 Z", inner: "M40.5 53 C38.5 51 36.5 48.5 35 46" },
  goblin: { outer: "M42 50 C32 45 20 41 7 40 C17 50 30 59 42 63 Z", inner: "M40 54 C32 50 22 46 13 43.5" },
  fin: { outer: "M42 48 C35 44 29 40 23 39 C27 45 27 52 25 58 C31 61 37 63 42 63 Z", inner: "M38 46 C35 50 34 55 33 60 M33 44 C30 49 30 54 29 59" },
  firbolg: { outer: "M42 51 C36 48.5 28 49.5 21 55.5 C28 60.5 36 61 42 59.5 Z", inner: "M39 54 C34 53.5 29 54.5 25 56" },
};

function Hair({ style, color, layer, uid }: { style: HairStyle; color: string; layer: "back" | "front"; uid: string }) {
  const dark = darken(color, 0.25);
  const fill = style === "flame" || style === "flameLong" ? `url(#${uid}-flame)` : color;
  const p = (d: string, extra?: Record<string, unknown>) => <path d={d} fill={fill} {...extra} />;

  if (layer === "back") {
    switch (style) {
      case "long":
        return p("M37 52 C35 32 47 23 60 23 C73 23 85 32 83 52 C84 68 88 84 92 98 C84 102 74 100 70 94 C68 86 68 80 67 74 L53 74 C52 80 52 86 50 94 C46 100 36 102 28 98 C32 84 36 68 37 52 Z");
      case "longStraight":
        return p("M37 52 C35 32 47 24 60 24 C73 24 85 32 83 52 C84 70 85 86 86 100 L72 100 C70 90 69 82 68 76 L52 76 C51 82 50 90 48 100 L34 100 C35 86 36 70 37 52 Z");
      case "braids":
        return (
          <g>
            {p("M38 52 C36 33 47 24 60 24 C73 24 84 33 82 52 L82 66 L38 66 Z")}
            <Sym>
              {[63, 70, 77, 84, 91].map((y, i) => (
                <ellipse key={y} cx={39 - i * 0.5} cy={y} rx={4.6} ry={4.1} fill={color} stroke={dark} strokeWidth={0.8} />
              ))}
              <rect x={34} y={95} width={7} height={3} rx={1} fill="#d4a24a" />
              <path d="M35 98 L33.5 104 M37.5 98 L37.5 105 M40 98 L41.5 104" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
            </Sym>
          </g>
        );
      case "ponytail":
        return p("M63 27 C79 28 87 42 85 60 C84 74 82 88 78 102 C72 98 71 86 73 72 C74 58 72 44 64 36 Z");
      case "pigtails":
        return (
          <g>
            {p("M38 52 C36 33 47 24 60 24 C73 24 84 33 82 52 Z")}
            <Sym>
              {p("M40 45 C30 47 23.5 57 23.5 69 C23.5 79 27.5 87 32 91 C33.5 83 36 75 40.5 65 Z")}
              <circle cx={39} cy={47} r={2.8} fill="#ffd166" />
            </Sym>
          </g>
        );
      case "curlyLong":
        return (
          <g fill={color}>
            {[
              [38, 60, 6.2],
              [36.5, 68, 6.2],
              [37.5, 76, 5.8],
              [40, 83, 5],
            ].map(([x, y, r]) => (
              <Sym key={`${x}-${y}`}>
                <circle cx={x} cy={y} r={r} />
              </Sym>
            ))}
          </g>
        );
      case "flameLong":
        return p("M37 52 C35 32 47 23 60 23 C73 23 85 32 83 52 C86 66 90 80 94 92 C88 90 84 86 82 80 C84 90 82 98 76 104 C74 92 70 84 67 76 L53 76 C50 84 46 92 44 104 C38 98 36 90 38 80 C36 86 32 90 26 92 C30 80 34 66 37 52 Z");
      case "plates":
        return (
          <g>
            <path d="M37.5 50 C36 32 47 23.5 60 23.5 C73 23.5 84 32 82.5 50 L85 82 L74 84 L71.5 70 L48.5 70 L46 84 L35 82 Z" fill={darken(color, 0.1)} />
            <Sym>
              <path d="M38 60 L45.5 61 M37 70 L46 71.5 M36 79 L46.5 80.5" stroke={darken(color, 0.4)} strokeWidth={1} />
            </Sym>
          </g>
        );
      default:
        return null;
    }
  }

  switch (style) {
    case "short":
      return p("M38.5 58 C36 40 44 26.5 60 26.5 C76 26.5 84 40 81.5 58 C80 50 77.5 45 73.5 42 C66 45.5 54 45.5 46.5 42 C42.5 45 40 50 38.5 58 Z");
    case "swept":
      return p("M38.5 58 C35.5 39 45 25.5 61 25.5 C77 25.5 85.5 38 82 57 C80.5 47 76.5 41.5 70 39.5 C62 45 50 47 42.5 45 C40.5 49 39.2 53 38.5 58 Z");
    case "long":
    case "braids":
    case "pigtails":
      return p("M38.5 60 C36 40 44 27.5 60 27.5 C76 27.5 84 40 81.5 60 C80 48 74.5 40 65 37 C58.5 42 48.5 44.5 42.5 46.5 C40.5 50.5 39.3 55 38.5 60 Z");
    case "longStraight":
      return p("M38.5 62 C36 40 45 26.5 60 26.5 C75 26.5 84 40 81.5 62 C80 50 76 41 66 36.5 C63.5 38.5 61.5 40.5 60 43 C58.5 40.5 56.5 38.5 54 36.5 C44 41 40 50 38.5 62 Z");
    case "topknot":
      return (
        <g>
          {p("M43 41 C45 31.5 52 28 60 28 C68 28 75 31.5 77 41 C71 37.5 49 37.5 43 41 Z")}
          <ellipse cx={60} cy={21} rx={5.8} ry={5.2} fill={color} />
          <rect x={55.5} y={24.5} width={9} height={3.2} rx={1.2} fill="#a8823f" />
        </g>
      );
    case "mohawk":
      return p("M54.5 44 C53 33 55 22 60 16 C65 22 67 33 65.5 44 C62.5 42.5 57.5 42.5 54.5 44 Z");
    case "ponytail":
      return p("M39 55 C37 38 46 28 60 28 C74 28 83 38 81 55 C79 46 74 40 66 38 C58 37 50 38.5 44.5 42.5 C41.5 46 40 50 39 55 Z");
    case "curly":
    case "curlyLong":
      return (
        <g fill={color}>
          <path d="M42 50 C42 38 50 31 60 31 C70 31 78 38 78 50 C72 44 66 42 60 42 C54 42 48 44 42 50 Z" />
          {[
            [40, 52, 6.4],
            [41, 43, 7],
            [46, 35, 7.4],
            [53, 30, 7.4],
            [61, 28.5, 7.6],
            [69, 30, 7.4],
            [75, 35, 7.4],
            [79, 43, 7],
            [80, 52, 6.4],
          ].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
          <g fill="none" stroke={dark} strokeWidth={0.8} strokeLinecap="round">
            <path d="M44 38 C46 36 48 37 48 39 M56 30 C58 28 60 29 60 31 M66 31 C68 29 70 30 70 32 M75 40 C77 38 79 39 79 41" />
          </g>
        </g>
      );
    case "tuft":
      return (
        <g fill={color}>
          <Sym>
            <circle cx={39.5} cy={50} r={6} />
            <circle cx={38} cy={43.5} r={5.4} />
            <circle cx={41.5} cy={38.5} r={4.8} />
          </Sym>
          <path d="M55 33 C56 26 61 23.5 65 26 M59 33 C61 28 64 27 67 29" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </g>
      );
    case "flame":
    case "flameLong":
      return p("M38 57 C34 42 38 30 45 23 C45 30 49 33 52 29 C51 20 56 12 61 5 C61 14 66 19 69 13 C75 21 82 30 81 41 C84 46 84 52 82 58 C80 48 74 42 66 40 C58 44 48 44 44 42 C41 46 39 51 38 57 Z");
    case "crest":
      return <path d="M55.5 31.5 L57.5 19 L62.5 19 L64.5 31.5 Z" fill={darken(color, 0.15)} stroke={darken(color, 0.4)} strokeWidth={0.8} />;
    case "plates":
      return (
        <path
          d="M40 47 C39 34 48 26.5 60 26.5 C72 26.5 81 34 80 47 C75 41 68 38.5 60 38.5 C52 38.5 45 41 40 47 Z"
          fill={darken(color, 0.1)}
          stroke={darken(color, 0.4)}
          strokeWidth={0.8}
        />
      );
    default:
      return null;
  }
}

function Beard({ style, color }: { style: BeardStyle; color: string }) {
  const dark = darken(color, 0.22);
  const mustache =
    "M49.5 70.5 C53 66.5 57.5 66.5 60 68.6 C62.5 66.5 67 66.5 70.5 70.5 C67 72.5 63 72.2 60 70.8 C57 72.2 53 72.5 49.5 70.5 Z";
  switch (style) {
    case "full":
      return (
        <g>
          <path
            d="M39.5 56 C39 70 43 84 50 94 C54 101 66 101 70 94 C77 84 81 70 80.5 56 C78 64 74.5 69.5 70 71.5 C66 74.5 54 74.5 50 71.5 C45.5 69.5 42 64 39.5 56 Z"
            fill={color}
          />
          <path d="M50 80 C52 86 54 90 56 93 M70 80 C68 86 66 90 64 93 M60 76 L60 92" stroke={dark} strokeWidth={0.9} fill="none" strokeLinecap="round" />
          <rect x={56} y={89} width={8} height={3.2} rx={1.2} fill="#d4a24a" />
          <path d={mustache} fill={dark} />
        </g>
      );
    case "stubble":
      return (
        <path
          d="M40.5 58 C41 70 47 79 60 80.5 C73 79 79 70 79.5 58 C77 66 73 71 68 72.5 C64 74 56 74 52 72.5 C47 71 43 66 40.5 58 Z"
          fill={color}
          opacity={0.2}
        />
      );
    case "goatee":
      return (
        <g>
          <path d="M55.5 75 C56 79 58 82.5 60 83.5 C62 82.5 64 79 64.5 75 C62.5 76.2 57.5 76.2 55.5 75 Z" fill={color} />
          <path d="M53.5 69.8 C56 68.4 58.5 68.6 60 69.4 C61.5 68.6 64 68.4 66.5 69.8" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        </g>
      );
    case "pointy":
      return (
        <g>
          <path d="M46 66 C47 76 53 86 60 97 C67 86 73 76 74 66 C70 72 65 74 60 74 C55 74 50 72 46 66 Z" fill={color} />
          <path d={mustache} fill={darken(color, 0.08)} />
        </g>
      );
    case "braided":
      return (
        <g>
          <path d="M42 60 C42 72 48 80 56 82 L56.5 101 L63.5 101 L64 82 C72 80 78 72 78 60 C74 68 68 72.5 60 72.5 C52 72.5 46 68 42 60 Z" fill={color} />
          <path d="M56.5 87 L63.5 85 M56.5 92 L63.5 90 M56.5 97 L63.5 95" stroke={dark} strokeWidth={0.9} />
          <rect x={55.5} y={98.5} width={9} height={3} rx={1.2} fill="#a8c27a" />
          <path d={mustache} fill={dark} />
        </g>
      );
    default:
      return null;
  }
}

function Eyes({ style, color, female }: { style: EyeStyle; color: string; female: boolean }) {
  switch (style) {
    case "normal":
      return (
        <Sym>
          <ellipse cx={52} cy={56} rx={4.2} ry={2.9} fill="#fbf7f0" />
          <circle cx={52.3} cy={56.2} r={2.3} fill={color} />
          <circle cx={52.3} cy={56.2} r={1.15} fill="#1a1410" />
          <circle cx={51.4} cy={55.3} r={0.7} fill="#fff" />
          <path d="M47.6 55.4 Q52 52 56.6 55" stroke="#2a1d16" strokeWidth={1.3} fill="none" strokeLinecap="round" />
          {female && <path d="M47.8 55.3 L46 54" stroke="#2a1d16" strokeWidth={1} strokeLinecap="round" />}
        </Sym>
      );
    case "glow":
      return (
        <Sym>
          <ellipse cx={52} cy={56} rx={6.2} ry={4.2} fill={color} opacity={0.25} />
          <ellipse cx={52} cy={56} rx={4.2} ry={2.7} fill={color} />
          <ellipse cx={52} cy={55.6} rx={2.3} ry={1.1} fill="#fff" opacity={0.8} />
          <path d="M47.6 55.2 Q52 52 56.6 54.8" stroke="#1d1016" strokeWidth={1.2} fill="none" strokeLinecap="round" />
          {female && <path d="M47.8 55.1 L46 53.8" stroke="#1d1016" strokeWidth={1} strokeLinecap="round" />}
        </Sym>
      );
    case "slit":
      return (
        <Sym>
          <ellipse cx={52} cy={56} rx={4.4} ry={3.1} fill={color} />
          <ellipse cx={52} cy={56} rx={0.95} ry={2.7} fill="#120d08" />
          <circle cx={50.7} cy={54.9} r={0.75} fill="#fff" opacity={0.9} />
          <path d="M47.3 55.3 Q52 51.6 56.8 55" stroke="#1d140c" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        </Sym>
      );
    case "beady":
      return (
        <Sym>
          <ellipse cx={52} cy={56.5} rx={3.6} ry={3} fill="#fff3c4" />
          <circle cx={52.4} cy={56.6} r={1.8} fill={color} />
          <circle cx={52.4} cy={56.6} r={0.8} fill="#140c06" />
          <path d="M47.8 54 L56.4 55.6" stroke="#2a3a12" strokeWidth={1.3} strokeLinecap="round" />
        </Sym>
      );
    case "visor":
      return (
        <Sym>
          <rect x={45.5} y={53} width={11} height={5} rx={2.5} fill={color} opacity={0.3} />
          <rect x={46.5} y={54.3} width={9} height={2.6} rx={1.3} fill={color} />
          <rect x={48} y={54.9} width={4} height={0.9} rx={0.45} fill="#fff" opacity={0.85} />
        </Sym>
      );
  }
}

function Brows({ style, color, skinShade }: { style: BrowStyle; color: string; skinShade: string }) {
  switch (style) {
    case "normal":
      return (
        <Sym>
          <path d="M47 50.5 Q51.5 48.3 56 49.8" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Sym>
      );
    case "thin":
      return (
        <Sym>
          <path d="M47.5 50.6 Q51.5 47.8 55.8 49.4" stroke={color} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        </Sym>
      );
    case "heavy":
      return (
        <Sym>
          <path d="M45.8 48.6 L56.2 51" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
        </Sym>
      );
    case "ridge":
      return (
        <Sym>
          <path d="M45 50 Q51 45.5 57.5 50" stroke={skinShade} strokeWidth={3.4} fill="none" strokeLinecap="round" />
        </Sym>
      );
    default:
      return null;
  }
}

function Nose({ style, skin, shade }: { style: NoseStyle; skin: string; shade: string }) {
  switch (style) {
    case "small":
      return <path d="M60.3 58.5 C59.4 62 58.4 64.4 59.6 65.5 C60.5 66.1 61.6 65.9 62.4 65.1" stroke={shade} strokeWidth={1.3} fill="none" strokeLinecap="round" />;
    case "button":
      return <ellipse cx={60} cy={64.2} rx={2.7} ry={2.1} fill={shade} />;
    case "gnome":
      return (
        <g>
          <ellipse cx={60} cy={63.4} rx={4.3} ry={3.7} fill={shade} />
          <ellipse cx={58.7} cy={62.2} rx={1.3} ry={0.9} fill={lighten(skin, 0.4)} opacity={0.7} />
        </g>
      );
    case "broad":
      return (
        <g>
          <path d="M55.5 65.6 C56.5 61.2 63.5 61.2 64.5 65.6 C62 67.2 58 67.2 55.5 65.6 Z" fill={shade} />
          <ellipse cx={58} cy={65.4} rx={0.95} ry={0.65} fill={darken(shade, 0.45)} />
          <ellipse cx={62} cy={65.4} rx={0.95} ry={0.65} fill={darken(shade, 0.45)} />
        </g>
      );
    case "pointy":
      return <path d="M59 57.5 L67.5 66.2 L58.6 66.4 Z" fill={shade} />;
    case "cat":
      return (
        <g>
          <path d="M57.2 63 L62.8 63 L60 66.2 Z" fill="#d98a9c" />
          <path d="M60 66.2 L60 68.4" stroke="#5a3a2a" strokeWidth={0.9} strokeLinecap="round" />
        </g>
      );
    case "firbolg":
      return (
        <g>
          <ellipse cx={60} cy={63.6} rx={5.4} ry={4.1} fill="#d58ea3" />
          <ellipse cx={57.6} cy={64.8} rx={1.1} ry={0.8} fill="#8f4f62" />
          <ellipse cx={62.4} cy={64.8} rx={1.1} ry={0.8} fill="#8f4f62" />
        </g>
      );
    case "snout":
      return (
        <g>
          <ellipse cx={60} cy={73} rx={11.5} ry={8.8} fill={lighten(skin, 0.14)} />
          <ellipse cx={56.4} cy={70.5} rx={1.4} ry={0.9} fill={darken(shade, 0.45)} />
          <ellipse cx={63.6} cy={70.5} rx={1.4} ry={0.9} fill={darken(shade, 0.45)} />
        </g>
      );
    default:
      return null;
  }
}

function Mouth({ style, lip }: { style: MouthStyle; lip: string }) {
  switch (style) {
    case "smile":
      return <path d="M54.5 71 Q60 74.6 65.5 71" stroke="#4a2a20" strokeWidth={1.5} fill="none" strokeLinecap="round" />;
    case "lips":
      return (
        <g>
          <path d="M54.5 71 Q57 69.6 60 70.5 Q63 69.6 65.5 71 Q60 75.8 54.5 71 Z" fill={lip} />
          <path d="M55 71.1 Q60 72.6 65 71.1" stroke={darken(lip, 0.35)} strokeWidth={0.6} fill="none" />
        </g>
      );
    case "stern":
      return <path d="M54 72.2 Q60 71.2 66 72.2" stroke="#2f2418" strokeWidth={1.6} fill="none" strokeLinecap="round" />;
    case "grin":
      return (
        <g>
          <path d="M50.5 68.5 Q60 78 69.5 68.5 Q60 71.6 50.5 68.5 Z" fill="#3a1a12" />
          <path d="M53 69.6 L54.6 72.4 L56.2 70.2 Z M58.5 70.6 L60 73.4 L61.5 70.6 Z M63.8 70.2 L65.4 72.4 L67 69.6 Z" fill="#fff6dc" />
        </g>
      );
    case "cat":
      return <path d="M56 69.6 Q58 71.6 60 69.6 Q62 71.6 64 69.6" stroke="#5a3a2a" strokeWidth={1.1} fill="none" strokeLinecap="round" />;
    case "grille":
      return (
        <g stroke="#3a424c" strokeWidth={1.4} strokeLinecap="round">
          <path d="M54 69.5 L66 69.5 M55 72.2 L65 72.2 M56.5 74.9 L63.5 74.9" />
        </g>
      );
    case "dragon":
      return <path d="M50.5 77.5 Q60 81.5 69.5 77.5" stroke="#3a1a10" strokeWidth={1.5} fill="none" strokeLinecap="round" />;
  }
}

function BehindHead({ extras }: { extras: Extra[] }) {
  return (
    <>
      {extras.includes("dragonHorns") && (
        <Sym>
          <path d="M44 38 C37 32 33 24 32 13 C37.5 21.5 43.5 27.5 50 31.5 Z" fill="#eadfc6" stroke="#b9a988" strokeWidth={0.8} />
          <path d="M41.5 46.5 C35 44.5 30 40.5 26.5 34 C33 38 38 40 43.5 41 Z" fill="#d9ccae" />
        </Sym>
      )}
      {extras.includes("halo") && <circle cx={60} cy={54} r={34} fill="#fff6d6" opacity={0.16} />}
      {extras.includes("embers") && <circle cx={60} cy={50} r={34} fill="#ff8a3a" opacity={0.12} />}
    </>
  );
}

function FaceDetails({ extras, skin, shade, hair }: { extras: Extra[]; skin: string; shade: string; hair: string }) {
  return (
    <>
      {extras.includes("scales") && (
        <g stroke={shade} strokeWidth={1.1} fill="none" strokeLinecap="round">
          <path d="M53.5 38 Q55.5 36 57.5 38 M62.5 38 Q64.5 36 66.5 38 M58 42.5 Q60 40.5 62 42.5" />
          <path d="M44 63 Q46 61 48 63 M72 63 Q74 61 76 63 M46.5 67.5 Q48.5 65.5 50.5 67.5 M69.5 67.5 Q71.5 65.5 73.5 67.5" />
        </g>
      )}
      {extras.includes("markings") && (
        <g fill={darken(skin, 0.35)}>
          <path d="M44.5 41 L52 45.5 L48.5 47 Z" />
          <path d="M75.5 41 L68 45.5 L71.5 47 Z" />
          <path d="M44.5 61 L49.5 64.5 L45.5 68.5 Z" />
          <path d="M75.5 61 L70.5 64.5 L74.5 68.5 Z" />
          <circle cx={58} cy={35.5} r={1.1} />
          <circle cx={62.5} cy={36.5} r={0.8} />
        </g>
      )}
      {extras.includes("stripes") && (
        <g stroke={hair} strokeWidth={2.2} strokeLinecap="round">
          <path d="M60 33.5 L60 42 M54 35 L55.6 41 M66 35 L64.4 41" />
          <Sym>
            <path d="M38.5 57.5 L45 59 M38 62.5 L44.5 62.8" />
          </Sym>
        </g>
      )}
      {extras.includes("freckles") && (
        <g fill={shade}>
          <Sym>
            <circle cx={47.6} cy={63.2} r={0.65} />
            <circle cx={50} cy={64.8} r={0.65} />
            <circle cx={46.2} cy={65.8} r={0.65} />
            <circle cx={48.8} cy={66.9} r={0.6} />
          </Sym>
        </g>
      )}
      {extras.includes("blush") && (
        <Sym>
          <ellipse cx={47.2} cy={65.5} rx={3.6} ry={2} fill="#e8796b" opacity={0.28} />
        </Sym>
      )}
      {extras.includes("warpaint") && (
        <Sym>
          <path d="M48.5 60 L48.5 66 M51.5 60.5 L51.5 67.5" stroke="#efe6d2" strokeWidth={1.4} strokeLinecap="round" opacity={0.85} />
        </Sym>
      )}
      {extras.includes("embers") && (
        <Sym>
          <path d="M44.5 62.5 L47.5 60.5 L49.5 63.5 M43 46 L46 47.5" stroke="#ffc46b" strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0.9} />
        </Sym>
      )}
      {extras.includes("gills") && (
        <Sym>
          <path d="M43.6 61 Q45.8 63 43.8 65.2 M44.6 65.6 Q46.8 67.6 44.8 69.8" stroke={shade} strokeWidth={1} fill="none" strokeLinecap="round" />
          <circle cx={45} cy={44} r={0.9} fill={shade} />
          <circle cx={43.6} cy={47} r={0.9} fill={shade} />
        </Sym>
      )}
      {extras.includes("rivets") && (
        <g>
          <path d="M47 44 L73 44 L71.5 69 L60 76.5 L48.5 69 Z" fill={lighten(skin, 0.12)} opacity={0.55} />
          <path d="M60 31.5 L60 44 M47.5 61 L52.5 66.5 M72.5 61 L67.5 66.5" stroke={shade} strokeWidth={1} />
          <g fill={shade}>
            <Sym>
              <circle cx={44.5} cy={44.5} r={1.15} />
              <circle cx={44} cy={63} r={1.15} />
            </Sym>
          </g>
        </g>
      )}
    </>
  );
}

function FrontExtras({ extras, gender }: { extras: Extra[]; gender: Gender }) {
  return (
    <>
      {(extras.includes("tusks") || extras.includes("smallTusks")) &&
        (extras.includes("tusks") ? (
          <Sym>
            <path d="M54.2 72.6 L52.6 65.4 L56.6 71.6 Z" fill="#f4ecd8" stroke="#cfc4a8" strokeWidth={0.5} />
          </Sym>
        ) : (
          <Sym>
            <path d="M54.8 72.2 L54.2 67.8 L56.6 71.5 Z" fill="#f4ecd8" stroke="#cfc4a8" strokeWidth={0.4} />
          </Sym>
        ))}
      {extras.includes("horns") && (
        <Sym>
          <path d="M47 36.5 C43 27 39 18 33.5 10.5 C41.5 15 49 23.5 54 33 Z" fill={gender === "f" ? "#2a1a33" : "#3a2433"} />
          <path d="M46.6 32.5 C43.6 26 40.6 20.5 36.8 15" stroke="#7a5a70" strokeWidth={0.9} fill="none" strokeLinecap="round" />
        </Sym>
      )}
      {extras.includes("whiskers") && (
        <Sym>
          <path d="M52.5 68 L35 65.5 M52.5 70 L36 72.5" stroke="#f7f0e4" strokeWidth={0.8} strokeLinecap="round" opacity={0.95} />
        </Sym>
      )}
      {extras.includes("earring") && (
        <Sym>
          <circle cx={39.6} cy={65.2} r={1.7} fill="none" stroke="#e3b341" strokeWidth={1.1} />
        </Sym>
      )}
      {extras.includes("halo") && (
        <g>
          <ellipse cx={60} cy={19} rx={17} ry={4.6} fill="none" stroke="#fff3c4" strokeWidth={6} opacity={0.25} />
          <ellipse cx={60} cy={19} rx={17} ry={4.6} fill="none" stroke="#ffe9a8" strokeWidth={2.4} />
        </g>
      )}
    </>
  );
}

function CatEars({ skin, inner }: { skin: string; inner: string }) {
  return (
    <Sym>
      <path d="M41 41 C38 32 38 22 41 14.5 C47 19.5 52 26 55 32 Z" fill={skin} />
      <path d="M43 36 C42 30 42 24 43.6 20 C47 24 50 28 52 32 Z" fill={inner} />
    </Sym>
  );
}

function MasterFigure({ uid }: { uid: string }) {
  return (
    <>
      <circle cx={60} cy={52} r={36} fill="none" stroke="#c7a6ff" strokeOpacity={0.22} strokeWidth={1.2} />
      <circle cx={60} cy={52} r={30} fill="none" stroke="#c7a6ff" strokeOpacity={0.12} strokeWidth={0.8} strokeDasharray="2 3" />
      <path d="M8 120 C10 98 26 86 42 82 L78 82 C94 86 110 98 112 120 Z" fill="#2b1d3d" />
      <path d="M34 86 C30 64 34 40 46 28 C52 22 56 20 60 20 C64 20 68 22 74 28 C86 40 90 64 86 86 C78 92 42 92 34 86 Z" fill={`url(#${uid}-hood)`} />
      <path d="M43 78 C41 60 46 42 60 38 C74 42 79 60 77 78 C71 84 49 84 43 78 Z" fill="#0e0916" stroke="#5a4278" strokeWidth={1.6} />
      <Sym>
        <ellipse cx={53} cy={60} rx={6} ry={3.4} fill="#ffd166" opacity={0.28} />
        <ellipse cx={53} cy={60} rx={3.4} ry={1.7} fill="#ffd166" />
      </Sym>
      <g transform="translate(60 104)">
        <path d="M0 -9 L7.8 -4.5 L7.8 4.5 L0 9 L-7.8 4.5 L-7.8 -4.5 Z" fill="#e0a43a" stroke="#7a5414" strokeWidth={1} />
        <path d="M0 -5 L5 3.5 L-5 3.5 Z" fill="#f3c766" stroke="#7a5414" strokeWidth={0.8} />
        <path d="M0 -9 L0 -5 M7.8 4.5 L5 3.5 M-7.8 4.5 L-5 3.5 M7.8 -4.5 L0 -5 M-7.8 -4.5 L0 -5 M0 9 L5 3.5 M0 9 L-5 3.5" stroke="#7a5414" strokeWidth={0.7} />
      </g>
    </>
  );
}

export interface RaceAvatarProps {
  raceId: string;
  gender: Gender;
  className?: string;
  title?: string;
}

export function RaceAvatar({ raceId, gender, className, title }: RaceAvatarProps) {
  const uid = `av${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  if (raceId === "master") {
    return (
      <svg viewBox="0 0 120 120" className={className} role="img" aria-label={title ?? "Master"}>
        <defs>
          <radialGradient id={`${uid}-bg`} cx="50%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#5b3a8a" />
            <stop offset="100%" stopColor="#120a1f" />
          </radialGradient>
          <linearGradient id={`${uid}-hood`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a3466" />
            <stop offset="100%" stopColor="#2a1d3d" />
          </linearGradient>
        </defs>
        <circle cx={60} cy={60} r={60} fill={`url(#${uid}-bg)`} />
        <MasterFigure uid={uid} />
      </svg>
    );
  }

  const spec = SPECS[raceId] ?? SPECS.umano;
  const g = gender;
  const [bg1, bg2] = pick(spec.bg, g);
  const skin = pick(spec.skin, g);
  const shade = pick(spec.shade, g);
  const hair = pick(spec.hair, g);
  const hairStyle = pick(spec.hairStyle, g);
  const beard = spec.beard ? pick(spec.beard, g) : "none";
  const ears = pick(spec.ears, g);
  const head = pick(spec.head, g);
  const extras = spec.extras ? pick(spec.extras, g) : [];
  const lip = spec.lip ? pick(spec.lip, g) : "#c4626b";
  const cloak = pick(spec.cloak, g);
  const trim = pick(spec.trim, g);
  const browColor = darken(hair, 0.2);
  const isForged = head === "forged";
  const ear = ears !== "none" && ears !== "cat" ? EARS[ears] : null;

  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label={title ?? raceId}>
      <defs>
        <radialGradient id={`${uid}-bg`} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor={bg1} />
          <stop offset="100%" stopColor={bg2} />
        </radialGradient>
        <radialGradient id={`${uid}-skin`} cx="42%" cy="38%" r="70%">
          <stop offset="55%" stopColor={skin} />
          <stop offset="100%" stopColor={shade} />
        </radialGradient>
        <linearGradient id={`${uid}-flame`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#d9361a" />
          <stop offset="55%" stopColor="#ff8a1f" />
          <stop offset="100%" stopColor="#ffe06a" />
        </linearGradient>
      </defs>
      <circle cx={60} cy={60} r={60} fill={`url(#${uid}-bg)`} />
      <BehindHead extras={extras} />
      <Hair style={hairStyle} color={hair} layer="back" uid={uid} />

      {/* spalle e collo */}
      <path d="M10 120 C12 101 31 92.5 60 92.5 C89 92.5 108 101 110 120 Z" fill={cloak} />
      {isForged ? (
        <g stroke={darken(cloak, 0.35)} strokeWidth={1}>
          <path d="M30 100 L44 96 M90 100 L76 96 M22 110 L40 104 M98 110 L80 104" />
        </g>
      ) : (
        <>
          <path d="M44 93.5 C49 101 54 106 60 109 C66 106 71 101 76 93.5" stroke={trim} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <circle cx={60} cy={109.5} r={2.6} fill={trim} />
        </>
      )}
      <path d="M51.5 70 L51.5 91 C55 95.5 65 95.5 68.5 91 L68.5 70 Z" fill={shade} />

      {ear && (
        <Sym>
          <path d={ear.outer} fill={skin} stroke="rgba(0,0,0,.18)" strokeWidth={0.7} />
          {ear.inner && <path d={ear.inner} stroke={shade} strokeWidth={1.1} fill="none" strokeLinecap="round" />}
        </Sym>
      )}
      {ears === "cat" && <CatEars skin={skin} inner="#e9a3b0" />}

      <path d={HEADS[head]} fill={`url(#${uid}-skin)`} stroke="rgba(0,0,0,.18)" strokeWidth={0.7} />
      {head === "cat" && <ellipse cx={60} cy={68.5} rx={8.6} ry={5.8} fill={lighten(skin, 0.6)} />}

      <FaceDetails extras={extras} skin={skin} shade={shade} hair={hair} />
      <Eyes style={pick(spec.eyes, g)} color={pick(spec.eyeColor, g)} female={g === "f"} />
      <Brows style={pick(spec.brows, g)} color={browColor} skinShade={shade} />
      <Nose style={pick(spec.nose, g)} skin={skin} shade={shade} />
      <Mouth style={pick(spec.mouth, g)} lip={lip} />
      <Beard style={beard} color={hair} />
      <Hair style={hairStyle} color={hair} layer="front" uid={uid} />
      <FrontExtras extras={extras} gender={g} />
    </svg>
  );
}
