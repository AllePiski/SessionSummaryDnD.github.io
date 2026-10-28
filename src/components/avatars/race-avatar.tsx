import { memo, useId } from "react";
import type { Gender } from "@/lib/types";
import {
  BehindHead,
  Beard,
  Brows,
  CatEars,
  EARS,
  Eyes,
  FaceDetails,
  FrontExtras,
  HEADS,
  Hair,
  MasterFigure,
  Mouth,
  Nose,
  Sym,
  darken,
  lighten,
} from "./avatar-parts";
import { RACE_SPECS, pick } from "./race-specs";

interface RaceAvatarProps {
  raceId: string;
  gender: Gender;
  className?: string;
  /** nome letto dagli screen reader; senza titolo l'avatar è decorativo */
  title?: string;
}

/**
 * Ritratto SVG di una razza (20 razze × 2 generi) o del master.
 * È il disegno più pesante dell'app, quindi è memoizzato: ha solo props primitive.
 */
export const RaceAvatar = memo(function RaceAvatar({ raceId, gender, className, title }: RaceAvatarProps) {
  const uid = `av${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // con un titolo l'avatar è un'immagine con nome, altrimenti è solo decorativo
  const a11y = title ? ({ role: "img", "aria-label": title } as const) : ({ "aria-hidden": true } as const);

  if (raceId === "master") {
    return (
      <svg viewBox="0 0 120 120" className={className} {...a11y}>
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

  const spec = RACE_SPECS[raceId] ?? RACE_SPECS.umano;
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
    <svg viewBox="0 0 120 120" className={className} {...a11y}>
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
});
