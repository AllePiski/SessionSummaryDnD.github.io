"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardCopy, Download, Ellipsis, FileText, FileType, Printer, ScrollText, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { saveBlob, sessionFileBase } from "@/lib/audio";
import { deleteSession } from "@/lib/repo";
import { screenplayToMarkdown, screenplayToText } from "@/lib/screenplay";
import type { Character, Session } from "@/lib/types";

/**
 * Azioni della sessione: scarica audio, esporta la sceneggiatura, elimina.
 * Su schermi stretti export ed eliminazione finiscono in un menu "⋯".
 */
export function SessionActions({
  session,
  characters,
  canDownload,
  onDownload,
}: {
  session: Session;
  characters: Map<string, Character>;
  canDownload: boolean;
  onDownload: () => void;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function exportText(kind: "txt" | "md") {
    const content = kind === "txt" ? screenplayToText(session, characters) : screenplayToMarkdown(session, characters);
    const blob = new Blob([content], { type: kind === "txt" ? "text/plain" : "text/markdown" });
    const result = await saveBlob(blob, `${sessionFileBase(session)} - sceneggiatura.${kind}`);
    if (result === "saved") toast.success("Sceneggiatura esportata.");
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(screenplayToText(session, characters));
      toast.success("Sceneggiatura copiata negli appunti.");
    } catch {
      toast.error("Copia non riuscita.");
    }
  }

  async function remove() {
    await deleteSession(session.id);
    toast.success("Sessione eliminata.");
    router.push("/sessions");
  }

  const exportItems = (
    <>
      <DropdownMenuItem onSelect={() => void exportText("txt")}>
        <FileText /> Sceneggiatura in testo (.txt)
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => void exportText("md")}>
        <FileType /> Sceneggiatura in Markdown (.md)
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setTimeout(() => window.print(), 50)}>
        <Printer /> Stampa o salva PDF
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => void copyText()}>
        <ClipboardCopy /> Copia negli appunti
      </DropdownMenuItem>
    </>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={onDownload} disabled={!canDownload}>
        <Download /> Scarica audio
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="hidden sm:inline-flex">
            <ScrollText /> Esporta sceneggiatura
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {exportItems}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        className="hidden sm:inline-flex"
        onClick={() => setConfirmDelete(true)}
        aria-label="Elimina sessione"
      >
        <Trash2 />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="sm:hidden" aria-label="Altre azioni">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {exportItems}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
            <Trash2 /> Elimina sessione
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa sessione?</AlertDialogTitle>
            <AlertDialogDescription>
              Audio e sceneggiatura salvati nel browser verranno cancellati. I file già scaricati non vengono toccati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void remove()}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
