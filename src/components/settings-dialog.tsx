"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, HardDrive, Settings, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useRecording, useTranscription } from "@/hooks/use-data";
import { db } from "@/lib/db";
import { formatBytes } from "@/lib/format";
import { setSetting } from "@/lib/repo";
import { SETTING_LANG } from "@/lib/settings";
import { SPEECH_LANGUAGES } from "@/lib/transcriber";

interface StorageInfo {
  usage: number;
  quota: number;
  persisted: boolean;
}

async function readStorage(): Promise<StorageInfo | null> {
  if (!navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  const persisted = (await navigator.storage.persisted?.()) ?? false;
  return { usage, quota, persisted };
}

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const speech = useTranscription();
  const { state } = useRecording();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void readStorage().then((info) => {
      if (!cancelled) setStorage(info);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function persist() {
    const ok = (await navigator.storage?.persist?.()) ?? false;
    if (ok) toast.success("Archivio protetto: il browser non cancellerà le registrazioni per liberare spazio.");
    else toast.warning("Il browser non ha concesso l'archiviazione persistente. Scarica gli audio per sicurezza.");
    setStorage(await readStorage());
  }

  async function wipe() {
    await db.delete();
    toast.success("Tutti i dati sono stati eliminati.");
    window.location.reload();
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => setOpen(true)} tooltip="Impostazioni">
            <Settings />
            <span>Impostazioni</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Impostazioni</DialogTitle>
            <DialogDescription>Tutto resta sul tuo dispositivo: niente account, niente server.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <section className="grid gap-3">
              <h3 className="text-sm font-medium">Riconoscimento vocale (facoltativo)</h3>
              {!speech.supported && (
                <p className="flex gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  Questo browser non supporta il riconoscimento vocale (serve Chrome, Edge o Safari). Audio e turni di
                  parola vengono registrati comunque.
                </p>
              )}
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="transcribe" className="flex-col items-start gap-0.5">
                  <span>Trascrivi le battute</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Spento di base: selezioni tu chi parla. Acceso, il testo viene assegnato al personaggio selezionato.
                  </span>
                </Label>
                <Switch
                  id="transcribe"
                  checked={speech.enabled}
                  disabled={!speech.supported}
                  onCheckedChange={speech.setEnabled}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="lang">Lingua parlata al tavolo</Label>
                <Select value={speech.lang} onValueChange={(v) => void setSetting(SETTING_LANG, v)}>
                  <SelectTrigger id="lang" className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPEECH_LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <Separator />

            <section className="grid gap-3">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <HardDrive className="size-4" /> Archivio locale
              </h3>
              {storage ? (
                <>
                  <Progress value={storage.quota ? (storage.usage / storage.quota) * 100 : 0} />
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(storage.usage)} usati su {formatBytes(storage.quota)} disponibili nel browser.
                  </p>
                  {storage.persisted ? (
                    <p className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-[#0ca30c]" /> Archivio protetto dalla pulizia automatica
                    </p>
                  ) : (
                    <Button variant="outline" size="sm" className="w-fit" onClick={() => void persist()}>
                      <ShieldCheck /> Proteggi le registrazioni
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Informazioni sullo spazio non disponibili.</p>
              )}
              <p className="text-xs text-muted-foreground">
                Le registrazioni restano in questo browser. Per una copia sicura scarica l&apos;audio di ogni sessione:
                il file prende il nome dalla data di gioco.
              </p>
            </section>

            <Separator />

            <section className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium">Elimina tutti i dati</h3>
                <p className="text-xs text-muted-foreground">Party, sessioni e audio verranno cancellati.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={state.status !== "idle"}>
                    <Trash2 /> Elimina
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare tutto?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Verranno cancellati definitivamente il party, tutte le sessioni e le registrazioni audio salvate
                      nel browser. Gli audio già scaricati non vengono toccati.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={() => void wipe()}>
                      Elimina tutto
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
