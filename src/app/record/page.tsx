import type { Metadata } from "next";
import { RecordView } from "@/components/record/record-view";

export const metadata: Metadata = { title: "Registra sessione" };

export default function RecordPage() {
  return <RecordView />;
}
