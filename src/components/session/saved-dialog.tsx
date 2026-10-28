"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { audioFileName } from "@/lib/audio";
import { formatBytes, formatDuration, plural } from "@/lib/format";
import type { Session } from "@/lib/types";

/** Mostrato appena finita una registrazione: invita a scaricare una copia dell'audio. */
export function SavedDialog({
  open,
  session,
  audio,
  onDownload,
  onClose,
}: {
  open: boolean;
  session: Session;
  audio: { blob: Blob; mimeType: string } | null;
  onDownload: () => void;
  onClose: () => void;
}) {
  const what = session.lines.length
    ? plural(session.lines.length, "battuta trascritta", "battute trascritte")
    : plural(session.turns.length, "turno di parola", "turni di parola");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sessione salvata! 🎲</DialogTitle>
          <DialogDescription>
            {formatDuration(session.durationMs)} di gioco e {what}. L&apos;audio è salvato solo in questo browser:
            scaricane una copia per tenerlo al sicuro.
          </DialogDescription>
        </DialogHeader>
        {audio && (
          <p className="rounded-lg bg-muted p-3 text-sm break-all">
            {audioFileName(session, audio.mimeType)}
            <span className="text-muted-foreground"> · {formatBytes(audio.blob.size)}</span>
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Più tardi
          </Button>
          <Button
            disabled={!audio}
            onClick={() => {
              onDownload();
              onClose();
            }}
          >
            <Download /> Scarica l&apos;audio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
