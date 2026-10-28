"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Archive, LayoutDashboard, Mic, Moon, Sun, Users } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { CharacterAvatar } from "@/components/avatars/character-avatar";
import { ElapsedTime } from "@/components/record/elapsed-time";
import { SettingsDialog } from "@/components/settings-dialog";
import { useCharacters, useRecording } from "@/hooks/use-data";
import { recoverInterruptedSessions } from "@/lib/repo";
import { characterColor } from "@/lib/colors";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/record", label: "Registra sessione", icon: Mic },
  { href: "/sessions", label: "Archivio sessioni", icon: Archive },
  { href: "/party", label: "Party", icon: Users },
];

function normalize(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/record": "Registra sessione",
  "/sessions": "Archivio sessioni",
  "/session": "Sessione",
  "/party": "Party",
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
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </SidebarInset>
      <RecoveryWatcher />
    </SidebarProvider>
  );
}

function AppSidebar({ pathname }: { pathname: string }) {
  const { setOpenMobile } = useSidebar();
  const characters = useCharacters();
  const party = (characters ?? []).filter((c) => c.kind === "pc");

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
            <span className="text-[11px] text-muted-foreground">Session Summary · D&amp;D</span>
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
        {party.length > 0 && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Il party</SidebarGroupLabel>
            <SidebarGroupContent>
              <ul className="grid gap-1 px-2">
                {party.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="relative">
                      <CharacterAvatar character={c} className="size-6" />
                      <span
                        className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full ring-2 ring-sidebar"
                        style={{ background: characterColor(c) }}
                      />
                    </span>
                    <span className="truncate">{c.name}</span>
                  </li>
                ))}
              </ul>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SettingsDialog />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function RecIndicator({ pathname }: { pathname: string }) {
  const { state } = useRecording();
  if (state.status === "idle" || pathname === "/record") return null;
  return (
    <Button asChild variant="outline" size="sm" className="gap-2 border-rec/40 text-rec">
      <Link href="/record">
        <span className={`size-2 rounded-full bg-rec ${state.status === "recording" ? "rec-dot" : ""}`} />
        {state.status === "paused" ? "In pausa" : "REC"}
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
  const { engine } = useRecording();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    recoverInterruptedSessions(engine.getSnapshot().sessionId)
      .then((sessions) =>
        sessions.forEach((s) =>
          toast.info(`Recuperata la sessione “${s.title}”`, {
            description: "La registrazione si era interrotta: audio e trascrizione sono stati salvati fin dove possibile.",
          }),
        ),
      )
      .catch(() => {});
  }, [engine]);
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
