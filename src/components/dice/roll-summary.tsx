"use client";

import { ChevronsDown, ChevronsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MODE_LABELS, totalsByPurpose, type RollResult } from "@/lib/dice";

/** Totale del lancio, dettaglio per gruppo e, se ci sono scopi, totali per scopo. */
export function RollSummary({ roll }: { roll: RollResult }) {
  const purposes = totalsByPurpose(roll);
  const showPurposes = roll.groups.some((g) => g.label) && purposes.length > 1;
  return (
    <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
      <div className="text-center sm:pr-4 sm:text-left">
        <p className="text-sm text-muted-foreground">Totale</p>
        <p className="text-5xl font-semibold tracking-tight">{roll.total}</p>
      </div>
      <div className="grid gap-2">
        <ul className="grid gap-1.5">
          {roll.groups.map((g) => {
            const nat20 = g.sides === 20 ? g.values.filter((v) => v === 20).length : 0;
            const nat1 = g.sides === 20 ? g.values.filter((v) => v === 1).length : 0;
            return (
              <li key={g.groupId} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="size-3 shrink-0 rounded-sm" style={{ background: g.color }} aria-hidden />
                <span className="font-medium">
                  {g.count}d{g.sides}
                  {g.label && ` ${g.label}`}
                </span>
                {g.mode !== "normal" && (
                  <Badge variant="outline" className="h-5 gap-0.5">
                    {g.mode === "advantage" ? (
                      <ChevronsUp className="text-success" />
                    ) : (
                      <ChevronsDown className="text-destructive" />
                    )}
                    {MODE_LABELS[g.mode]}
                  </Badge>
                )}
                <span className="text-muted-foreground tabular">
                  [
                  {g.values.map((v, i) => (
                    <span key={i}>
                      {i > 0 && ", "}
                      <span className="text-foreground">{v}</span>
                      {g.discarded?.[i] !== undefined && (
                        <span className="line-through opacity-70" title="Tiro scartato">
                          {" "}
                          {g.discarded[i]}
                        </span>
                      )}
                    </span>
                  ))}
                  ]{g.modifier !== 0 && ` ${g.modifier > 0 ? "+" : "−"} ${Math.abs(g.modifier)}`}
                </span>
                {nat20 > 0 && <Badge className="h-5 bg-[#d4a017] text-black">20 naturale!</Badge>}
                {nat1 > 0 && (
                  <Badge variant="destructive" className="h-5">
                    1 naturale
                  </Badge>
                )}
                <span className="ml-auto font-semibold tabular">{g.subtotal}</span>
              </li>
            );
          })}
        </ul>
        {showPurposes && (
          <div className="flex flex-wrap gap-2 border-t pt-2">
            {purposes.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm">
                <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
                {p.label}
                <span className="font-semibold tabular">{p.total}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
