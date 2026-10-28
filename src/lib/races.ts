import type { Gender } from "./types";

export const RACES = [
  { id: "umano", m: "Umano", f: "Umana" },
  { id: "elfo", m: "Elfo", f: "Elfa" },
  { id: "mezzelfo", m: "Mezzelfo", f: "Mezzelfa" },
  { id: "drow", m: "Drow", f: "Drow" },
  { id: "nano", m: "Nano", f: "Nana" },
  { id: "halfling", m: "Halfling", f: "Halfling" },
  { id: "gnomo", m: "Gnomo", f: "Gnoma" },
  { id: "orco", m: "Orco", f: "Orchessa" },
  { id: "mezzorco", m: "Mezzorco", f: "Mezzorchessa" },
  { id: "goblin", m: "Goblin", f: "Goblin" },
  { id: "hobgoblin", m: "Hobgoblin", f: "Hobgoblin" },
  { id: "tiefling", m: "Tiefling", f: "Tiefling" },
  { id: "aasimar", m: "Aasimar", f: "Aasimar" },
  { id: "dragonide", m: "Dragonide", f: "Dragonide" },
  { id: "goliath", m: "Goliath", f: "Goliath" },
  { id: "tabaxi", m: "Tabaxi", f: "Tabaxi" },
  { id: "firbolg", m: "Firbolg", f: "Firbolg" },
  { id: "genasi", m: "Genasi", f: "Genasi" },
  { id: "tritone", m: "Tritone", f: "Tritone" },
  { id: "forgiato", m: "Forgiato", f: "Forgiata" },
] as const;

export const MASTER_AVATAR = "master";

export function raceLabel(raceId: string, gender: Gender): string {
  if (raceId === MASTER_AVATAR) return "Master";
  const race = RACES.find((r) => r.id === raceId);
  return race ? race[gender] : "Avventuriero";
}

export const CLASSES = [
  "Artefice",
  "Barbaro",
  "Bardo",
  "Chierico",
  "Druido",
  "Guerriero",
  "Ladro",
  "Mago",
  "Monaco",
  "Paladino",
  "Ranger",
  "Stregone",
  "Warlock",
] as const;
