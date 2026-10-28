"use client";

import { History, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFormula, type RollResult } from "@/lib/dice";

/** Ultimi lanci: un tocco ripete il lancio. */
export function RollHistory({
  persist,
  history,
  onRepeat,
  onClear,
}: {
  persist: boolean;
  history: RollResult[];
  onRepeat: (roll: RollResult) => void;
  onClear: () => void;
}) {
  return (
    <aside className="grid content-start gap-2 @3xl:border-l @3xl:pl-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-medium">
          <History className="size-4 text-muted-foreground" /> Ultimi lanci
        </h3>
        {history.length > 0 && (
          <Button variant="ghost" size="icon-xs" onClick={onClear} aria-label="Cancella lo storico dei lanci">
            <Trash2 />
          </Button>
        )}
      </div>
      {!persist && (
        <p className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
          Senza party i lanci non vengono salvati: spariscono quando lasci la pagina.
        </p>
      )}
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun lancio ancora.</p>
      ) : (
        <ol className="grid max-h-96 gap-1 overflow-y-auto">
          {history.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onRepeat(r)}
                aria-label={`Ripeti ${formatFormula(r.groups)} (uscito ${r.total})`}
                className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="w-9 text-right text-lg font-semibold tabular">{r.total}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs">{formatFormula(r.groups)}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {new Date(r.at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-visible:opacity-100">
                  <RotateCcw className="size-3.5" /> Ripeti
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
