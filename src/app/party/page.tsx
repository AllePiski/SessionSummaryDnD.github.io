import type { Metadata } from "next";
import { PartyView } from "@/components/party/party-view";

export const metadata: Metadata = { title: "Party" };

export default function PartyPage() {
  return <PartyView />;
}
