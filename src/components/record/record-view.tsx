"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRecordingStatus } from "@/hooks/use-data";
import { LiveSession } from "./live-session";
import { SessionSetup } from "./session-setup";

export function RecordView() {
  const status = useRecordingStatus();
  // dopo "Termina e salva" resta il messaggio di salvataggio finché non si apre la sessione
  const [leaving, setLeaving] = useState(false);
  const live = status === "recording" || status === "paused" || status === "stopping" || status === "save-failed";
  if (live) return <LiveSession onLeaving={setLeaving} />;
  if (leaving) return <SavingScreen />;
  return <SessionSetup />;
}

function SavingScreen() {
  return (
    <div className="grid min-h-[50vh] place-items-center" aria-busy>
      <p className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Salvataggio della sessione…
      </p>
    </div>
  );
}
