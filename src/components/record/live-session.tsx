"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DiceRoller } from "@/components/dice/dice-roller";
import { FirstRecordingTips } from "./first-recording-tips";
import { RecordingStatusBar } from "./recording-status-bar";
import { SpeakerBoard } from "./speaker-board";
import { TranscriptPanel } from "./transcript-panel";
import { useCharacterMap, useRecordingState } from "@/hooks/use-data";
import { kindRank } from "@/lib/characters";
import type { Character } from "@/lib/types";

/**
 * Schermata della registrazione in corso. Ogni parte si iscrive solo ai dati
 * del motore che le servono, così una parola riconosciuta non ridisegna tutto.
 */
export function LiveSession({ onLeaving }: { onLeaving: (leaving: boolean) => void }) {
  const router = useRouter();
  const characters = useCharacterMap();
  const participantIds = useRecordingState((s) => s.participantIds);
  const [diceOpen, setDiceOpen] = useState(false);

  // la pagina della sessione è pronta prima di premere "Termina"
  useEffect(() => {
    router.prefetch("/session/");
  }, [router]);

  // master, poi party nell'ordine di creazione, poi i PNG nell'ordine di arrivo
  // (l'ordine non cambia durante la serata, così i tasti 1–0 restano stabili)
  const participants = useMemo(
    () =>
      participantIds
        .map((id, arrival) => ({ c: characters.get(id), arrival }))
        .filter((x): x is { c: Character; arrival: number } => !!x.c)
        .sort(
          (a, b) =>
            kindRank(a.c) - kindRank(b.c) || (a.c.kind === "pc" ? a.c.order - b.c.order : a.arrival - b.arrival),
        )
        .map((x) => x.c),
    [participantIds, characters],
  );

  return (
    <div className="mx-auto grid max-w-7xl gap-4">
      <RecordingStatusBar characters={characters} onLeaving={onLeaving} onOpenDice={() => setDiceOpen(true)} />
      <FirstRecordingTips />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SpeakerBoard participants={participants} characters={characters} />
        <TranscriptPanel characters={characters} />
      </div>

      <Sheet open={diceOpen} onOpenChange={setDiceOpen}>
        <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Tiro dei dadi</SheetTitle>
            <SheetDescription>La registrazione continua mentre tiri.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <DiceRoller bare />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
