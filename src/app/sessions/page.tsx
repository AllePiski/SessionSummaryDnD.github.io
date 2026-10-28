import type { Metadata } from "next";
import { SessionsView } from "@/components/sessions/sessions-view";

export const metadata: Metadata = { title: "Archivio sessioni" };

export default function SessionsPage() {
  return <SessionsView />;
}
