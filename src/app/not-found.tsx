import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-4 py-20 text-center">
      <p className="font-display text-6xl font-bold text-primary">1</p>
      <h2 className="text-xl font-semibold">Fallimento critico!</h2>
      <p className="text-muted-foreground">Questa pagina non esiste. Forse il dado ha deciso altrimenti.</p>
      <Button asChild>
        <Link href="/">Torna alla dashboard</Link>
      </Button>
    </div>
  );
}
