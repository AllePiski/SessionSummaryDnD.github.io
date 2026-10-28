import type { Gender } from "@/lib/types";

/*
 * Parametri dei ritratti SVG delle razze. Ogni voce descrive colori e forme
 * (testa, orecchie, capelli, occhi…) che le parti in avatar-parts.tsx disegnano.
 */

export type HeadStyle = "oval" | "soft" | "round" | "square" | "dragon" | "cat" | "forged" | "goblin";
export type EarStyle = "human" | "elf" | "halfelf" | "orc" | "goblin" | "fin" | "firbolg" | "cat" | "none";
export type EyeStyle = "normal" | "glow" | "slit" | "beady" | "visor";
export type BrowStyle = "normal" | "thin" | "heavy" | "ridge" | "none";
export type NoseStyle = "small" | "button" | "gnome" | "broad" | "pointy" | "cat" | "firbolg" | "snout" | "none";
export type MouthStyle = "smile" | "lips" | "stern" | "grin" | "cat" | "grille" | "dragon";
export type HairStyle =
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
export type BeardStyle = "full" | "stubble" | "goatee" | "pointy" | "braided" | "none";
export type Extra =
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

export function pick<T>(value: G<T>, gender: Gender): T {
  if (value && typeof value === "object" && "m" in value && "f" in value) {
    return (value as { m: T; f: T })[gender];
  }
  return value as T;
}

/** Aspetto di ogni razza: colori, forme e dettagli (con varianti per genere). */
export const RACE_SPECS: Record<string, Spec> = {
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
