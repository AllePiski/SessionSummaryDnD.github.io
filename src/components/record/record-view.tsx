"use client";

import { useRecording } from "@/hooks/use-data";
import { LiveSession } from "./live-session";
import { SessionSetup } from "./session-setup";

export function RecordView() {
  const { state } = useRecording();
  const live = state.status === "recording" || state.status === "paused" || state.status === "stopping";
  return live ? <LiveSession /> : <SessionSetup />;
}
