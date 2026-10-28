import type { Metadata } from "next";
import { DiceRoller } from "@/components/dice/dice-roller";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Tiro dei dadi" };

export default function DicePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Tiro dei dadi"
        description="Scegli quanti dadi e di che tipo, anche misti. Se vuoi, indica a cosa serve ogni gruppo (es. 1d8 Fuoco + 1d8 Ghiaccio): i totali restano separati."
      />
      <DiceRoller />
    </div>
  );
}
