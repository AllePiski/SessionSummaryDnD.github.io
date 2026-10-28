import { Card } from "@/components/ui/card";

/** Riquadro con un numero chiave (durata, turni, sessioni…). */
export function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card size="sm" className="gap-1 px-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {detail && <p className="truncate text-xs text-muted-foreground">{detail}</p>}
    </Card>
  );
}
