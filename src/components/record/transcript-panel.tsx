"use client";

import { TriangleAlert } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveTranscript, TurnLog } from "./live-transcript";
import { useRecordingState } from "@/hooks/use-data";
import { plural } from "@/lib/format";
import type { Character } from "@/lib/types";

/**
 * Pannello laterale della registrazione: trascrizione dal vivo se il
 * riconoscimento vocale è acceso, altrimenti il registro dei turni.
 */
export function TranscriptPanel({ characters }: { characters: Map<string, Character> }) {
  const speech = useRecordingState((s) => s.speech);
  const speechMessage = useRecordingState((s) => s.speechMessage);
  const lines = useRecordingState((s) => s.lines);
  const interim = useRecordingState((s) => s.interim);
  const turns = useRecordingState((s) => s.turns);
  const currentTurn = useRecordingState((s) => s.currentTurn);
  const transcribing = speech === "listening" || speech === "paused" || speech === "error";
  const turnCount = turns.length + (currentTurn ? 1 : 0);

  return (
    <Card className="h-[60vh] gap-0 py-0 xl:sticky xl:top-[9.5rem] xl:h-[calc(100dvh-10.5rem)]">
      <CardHeader className="border-b py-3">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          {transcribing ? "Trascrizione dal vivo" : "Turni di parola"}
          <span className="text-xs font-normal text-muted-foreground">
            {transcribing ? plural(lines.length, "battuta", "battute") : plural(turnCount, "turno", "turni")}
          </span>
        </CardTitle>
        {speech === "error" && speechMessage && (
          <p className="flex gap-1.5 text-xs text-muted-foreground" role="status">
            <TriangleAlert className="mt-px size-3.5 shrink-0 text-warning" />
            {speechMessage}
          </p>
        )}
      </CardHeader>
      <div className="min-h-0 flex-1">
        {transcribing ? (
          <LiveTranscript lines={lines} interim={interim} characters={characters} />
        ) : (
          <TurnLog turns={turns} currentTurn={currentTurn} characters={characters} />
        )}
      </div>
    </Card>
  );
}
