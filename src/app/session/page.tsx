import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoading } from "@/components/page-header";
import { SessionView } from "@/components/session/session-view";

export const metadata: Metadata = { title: "Sessione" };

// L'id della sessione arriva da ?id=… (le sessioni vivono nel browser,
// quindi non esistono pagine statiche per ognuna).
export default function SessionPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <SessionView />
    </Suspense>
  );
}
