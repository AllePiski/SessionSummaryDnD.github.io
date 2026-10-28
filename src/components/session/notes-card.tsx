"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateSessionInfo } from "@/lib/repo";
import type { Session } from "@/lib/types";

const AUTOSAVE_MS = 800;

/** Note libere della sessione, salvate da sole mentre si scrive. */
export function NotesCard({ session }: { session: Session }) {
  const [notes, setNotes] = useState(session.notes ?? "");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const pending = useRef<string | null>(null);
  const dirty = notes !== (session.notes ?? "");

  const sessionId = session.id;
  const flush = useCallback(() => {
    if (pending.current === null) return;
    const value = pending.current;
    pending.current = null;
    void updateSessionInfo(sessionId, { notes: value }).then(() => setSavedAt(new Date()));
  }, [sessionId]);

  // salva poco dopo l'ultima modifica…
  useEffect(() => {
    if (pending.current === null) return;
    const timer = setTimeout(flush, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [notes, flush]);

  // …e subito se si nasconde la scheda o si lascia la pagina
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [flush]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Note del master</CardTitle>
        <CardDescription>Riassunto, bottino, cose da ricordare per la prossima volta.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Textarea
          value={notes}
          rows={6}
          placeholder="Il party ha trovato la mappa della cripta…"
          aria-label="Note del master"
          onChange={(e) => {
            setNotes(e.target.value);
            pending.current = e.target.value;
          }}
        />
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {dirty
            ? "Salvataggio…"
            : savedAt
              ? `Salvate alle ${savedAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`
              : "Si salvano da sole mentre scrivi."}
        </p>
      </CardContent>
    </Card>
  );
}
