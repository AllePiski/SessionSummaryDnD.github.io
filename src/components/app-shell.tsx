"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Archive, AudioLines, Dices, LayoutDashboard, Mic, Moon, Sun, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { ElapsedTime } from "@/components/record/elapsed-time";
import { SettingsDialog } from "@/components/settings-dialog";
import { useCharacters, useRecordingState, useRecordingStatus, useTranscription } from "@/hooks/use-data";
import { formatClock } from "@/lib/format";
import { splitByKind } from "@/lib/characters";
import { getRecordingEngine } from "@/lib/recording-engine";
import { recoverInterruptedSessions } from "@/lib/repo";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/record", label: "Registrazione", icon: Mic },
  { href: "/sessions", label: "Archivio sessioni", icon: Archive },
  { href: "/party", label: "Party", icon: Users },
  { href: "/dice", label: "Tiro dei dadi", icon: Dices },
];

function normalize(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/record": "Registrazione",
  "/sessions": "Archivio sessioni",
  "/session": "Sessione",
  "/party": "Party",
  "/dice": "Tiro dei dadi",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = normalize(usePathname());
  return (
    <SidebarProvider>
      <AppSidebar pathname={pathname} />
      <SidebarInset className="min-w-0">
        <header className="no-print sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-backdrop-filter:bg-background/70">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 data-vertical:h-5" />
          <h1 className="truncate text-sm font-medium">{TITLES[pathname] ?? "Cronache del Tavolo"}</h1>
          <div className="ml-auto flex items-center gap-1.5">
            <RecIndicator pathname={pathname} />
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
      </SidebarInset>
      <RecoveryWatcher />
      <StopNotifier />
      <RecordingTabTitle />
    </SidebarProvider>
  );
}

function AppSidebar({ pathname }: { pathname: string }) {
  const { setOpenMobile } = useSidebar();
  const characters = useCharacters();
  const { master, pcs } = splitByKind(characters ?? []);
  // master in testa: la lista porta alla pagina Party

  return (
    <Sidebar collapsible="icon" className="no-print">
      <SidebarHeader>
        <Link
          href="/"
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-2.5 rounded-lg p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <D20Logo className="size-8 shrink-0" />
          <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-[15px] font-bold tracking-wide">Cronache del Tavolo</span>
            <span className="text-[11px] text-muted-foreground">Diario delle sessioni di D&amp;D</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigazione</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {pcs.length > 0 && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Il party</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[...(master ? [master] : []), ...pcs].map((c) => (
                  <SidebarMenuItem key={c.id}>
                    <SidebarMenuButton asChild size="sm" className="[&_svg]:size-5">
                      <Link href="/party" onClick={() => setOpenMobile(false)}>
                        <CharacterAvatar character={c} showColor ringClassName="ring-sidebar" className="size-5" />
                        <span>{c.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SpeechToggle />
        <SettingsDialog />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/** Opzione facoltativa: trascrive le battute oltre alla selezione manuale di chi parla. */
function SpeechToggle() {
  const { enabled, supported, setEnabled } = useTranscription();
  return (
    <>
      <div className="grid gap-1 rounded-lg border border-sidebar-border p-2.5 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2">
          <AudioLines className="size-4 shrink-0 text-muted-foreground" />
          <Label htmlFor="sidebar-speech" className="flex-1 text-sm font-normal">
            Riconoscimento vocale
          </Label>
          <Switch id="sidebar-speech" checked={enabled} disabled={!supported} onCheckedChange={setEnabled} />
        </div>
        <p className="text-xs leading-snug text-muted-foreground">
          {!supported
            ? "Non disponibile in questo browser."
            : enabled
              ? "Le battute vengono trascritte e assegnate a chi è selezionato."
              : "Spento: selezioni tu chi sta parlando."}
        </p>
      </div>
      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={enabled}
            disabled={!supported}
            onClick={() => setEnabled(!enabled)}
            tooltip={enabled ? "Riconoscimento vocale: acceso" : "Riconoscimento vocale: spento"}
          >
            <AudioLines />
            <span>Riconoscimento vocale</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}

function RecIndicator({ pathname }: { pathname: string }) {
  const status = useRecordingStatus();
  if (status === "idle" || pathname === "/record") return null;
  return (
    <Button asChild variant="outline" size="sm" className="gap-2 border-rec-bright/40 text-rec-bright">
      <Link href="/record">
        <span className={`size-2 rounded-full bg-rec-bright ${status === "recording" ? "rec-dot" : ""}`} />
        {status === "paused" ? "In pausa" : "REC"}
        <ElapsedTime className="font-medium text-foreground" />
      </Link>
    </Button>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // etichetta fissa: il tema salvato si conosce solo dopo l'idratazione,
  // le icone invece seguono la classe .dark via CSS
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      aria-label="Cambia tema (chiaro/scuro)"
    >
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  );
}

/** All'avvio ricostruisce le sessioni rimaste a metà (tab chiusa o crash). */
function RecoveryWatcher() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    recoverInterruptedSessions(getRecordingEngine().getSnapshot().sessionId)
      .then((sessions) =>
        sessions.forEach((s) =>
          toast.info(`Recuperata la sessione “${s.title}”`, {
            description: "La registrazione si era interrotta: audio e trascrizione sono stati salvati fin dove possibile.",
          }),
        ),
      )
      .catch(() => {});
  }, []);
  return null;
}

/** Avvisa quando una registrazione si chiude da sola (es. microfono scollegato). */
function StopNotifier() {
  const router = useRouter();
  const lastStop = useRecordingState((s) => s.lastStop);
  useEffect(() => {
    if (!lastStop) return;
    if (lastStop.reason === "mic-ended") {
      const { sessionId, durationMs } = lastStop;
      toast.warning("Il microfono si è scollegato", {
        description: `La registrazione è stata salvata fino a ${formatClock(durationMs)}.`,
        duration: Infinity,
        action: { label: "Apri sessione", onClick: () => router.push(`/session/?id=${sessionId}`) },
      });
    }
    getRecordingEngine().clearLastStop();
  }, [lastStop, router]);
  return null;
}

const TAB_PREFIX = /^(● REC [\d:]+|⏸ In pausa) · /;

/** Durante la registrazione il titolo della scheda mostra "● REC 1:02:33" o "⏸ In pausa". */
function RecordingTabTitle() {
  const status = useRecordingStatus();
  useEffect(() => {
    if (status !== "recording" && status !== "paused") return;
    const update = () => {
      const base = document.title.replace(TAB_PREFIX, "");
      const prefix = status === "paused" ? "⏸ In pausa" : `● REC ${formatClock(getRecordingEngine().elapsed())}`;
      document.title = `${prefix} · ${base}`;
    };
    update();
    const id = setInterval(update, 1000);
    return () => {
      clearInterval(id);
      document.title = document.title.replace(TAB_PREFIX, "");
    };
  }, [status]);
  return null;
}

export function D20Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z" fill="var(--primary)" stroke="color-mix(in oklch, var(--primary) 45%, black)" strokeWidth="2" />
      <path d="M32 16 L45.5 39.5 L18.5 39.5 Z" fill="color-mix(in oklch, var(--primary) 70%, white)" stroke="color-mix(in oklch, var(--primary) 45%, black)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M32 4 L32 16 M56 46 L45.5 39.5 M8 46 L18.5 39.5 M56 18 L32 16 M8 18 L32 16 M32 60 L45.5 39.5 M32 60 L18.5 39.5" stroke="color-mix(in oklch, var(--primary) 45%, black)" strokeWidth="1.6" />
      <circle cx="32" cy="31" r="3" fill="var(--rec)" />
    </svg>
  );
}
