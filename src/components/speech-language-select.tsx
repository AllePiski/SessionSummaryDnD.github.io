"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranscription } from "@/hooks/use-data";
import { SPEECH_LANGUAGES } from "@/lib/transcriber";
import { cn } from "@/lib/utils";

/** Lingua del riconoscimento vocale (vale subito anche a registrazione in corso). */
export function SpeechLanguageSelect({ id, className }: { id?: string; className?: string }) {
  const { lang, setLang } = useTranscription();
  return (
    <Select value={lang} onValueChange={setLang}>
      <SelectTrigger id={id} className={cn("w-44", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SPEECH_LANGUAGES.map((l) => (
          <SelectItem key={l.value} value={l.value}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
