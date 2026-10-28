"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Crown, Minus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CharacterFields } from "@/components/characters/character-fields";
import { PageHeader } from "@/components/page-header";
import { createParty, type CharacterDraft } from "@/lib/repo";
import type { Character } from "@/lib/types";

const MAX_PLAYERS = 12;

/** Avatar di partenza variati, giusto per non avere un party di cloni. */
const STARTERS: Pick<CharacterDraft, "raceId" | "gender">[] = [
  { raceId: "elfo", gender: "f" },
  { raceId: "nano", gender: "m" },
  { raceId: "umano", gender: "m" },
  { raceId: "tiefling", gender: "f" },
  { raceId: "halfling", gender: "m" },
  { raceId: "dragonide", gender: "m" },
  { raceId: "mezzelfo", gender: "f" },
  { raceId: "orco", gender: "m" },
  { raceId: "gnomo", gender: "f" },
  { raceId: "tabaxi", gender: "m" },
  { raceId: "aasimar", gender: "f" },
  { raceId: "goliath", gender: "m" },
];

function starter(i: number): CharacterDraft {
  return { name: "", ...STARTERS[i % STARTERS.length] };
}

export function PartyWizard({ existingMaster }: { existingMaster?: Character }) {
  const router = useRouter();
  const [step, setStep] = useState<"count" | "details">("count");
  const [count, setCount] = useState(4);
  const [members, setMembers] = useState<CharacterDraft[]>(() => Array.from({ length: 4 }, (_, i) => starter(i)));
  const [master, setMaster] = useState<CharacterDraft>(
    existingMaster
      ? { name: existingMaster.name, raceId: existingMaster.raceId, gender: existingMaster.gender, photo: existingMaster.photo }
      : { name: "Master", raceId: "master", gender: "m" },
  );
  const [saving, setSaving] = useState(false);

  function resize(next: number) {
    const n = Math.max(1, Math.min(MAX_PLAYERS, next));
    setCount(n);
    setMembers((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? starter(i)));
  }

  async function finish() {
    setSaving(true);
    try {
      await createParty(
        { ...master, name: master.name.trim() || "Master" },
        members.map((m, i) => ({ ...m, name: m.name.trim() || `Personaggio ${i + 1}` })),
      );
      toast.success("Il party è pronto all'avventura!");
      router.push("/");
    } catch {
      toast.error("Non sono riuscito a salvare il party.");
      setSaving(false);
    }
  }

  if (step === "count") {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Crea il tuo party"
          description="Prima di tutto: quanti giocatori siedono al tavolo? Il master lo aggiungiamo a parte."
        />
        <Card>
          <CardContent className="grid gap-8 py-6">
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="outline"
                size="icon-lg"
                className="size-12 rounded-full"
                onClick={() => resize(count - 1)}
                disabled={count <= 1}
                aria-label="Un giocatore in meno"
              >
                <Minus />
              </Button>
              <div className="text-center">
                <div className="text-7xl font-semibold" aria-live="polite">
                  {count}
                </div>
                <div className="text-sm text-muted-foreground">{count === 1 ? "giocatore" : "giocatori"}</div>
              </div>
              <Button
                variant="outline"
                size="icon-lg"
                className="size-12 rounded-full"
                onClick={() => resize(count + 1)}
                disabled={count >= MAX_PLAYERS}
                aria-label="Un giocatore in più"
              >
                <Plus />
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <Button
                  key={n}
                  variant={n === count ? "default" : "secondary"}
                  size="sm"
                  className="min-w-10"
                  onClick={() => resize(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
            <Button size="lg" className="mx-auto h-11 px-6 text-base" onClick={() => setStep("details")}>
              Avanti <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Presenta gli eroi"
        description="Nome, razza e (se vuoi) una foto per ognuno. Potrai modificare tutto anche in seguito."
        actions={
          <Button variant="ghost" onClick={() => setStep("count")}>
            <ArrowLeft /> Numero di giocatori
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="ring-primary/40 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="size-4 text-primary" /> Il master
            </CardTitle>
            <CardDescription>Chi narra la storia e dà voce ai PNG.</CardDescription>
          </CardHeader>
          <CardContent>
            <CharacterFields value={master} onChange={setMaster} allowMasterAvatar namePlaceholder="Master" />
          </CardContent>
        </Card>
        {members.map((member, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Giocatore {i + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <CharacterFields
                value={member}
                onChange={(next) => setMembers((prev) => prev.map((m, j) => (j === i ? next : m)))}
                namePlaceholder={`Personaggio ${i + 1}`}
                showPlayer
                showClass
              />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button size="lg" className="h-11 px-6 text-base" onClick={() => void finish()} disabled={saving}>
          <Sparkles /> Crea il party
        </Button>
      </div>
    </div>
  );
}
