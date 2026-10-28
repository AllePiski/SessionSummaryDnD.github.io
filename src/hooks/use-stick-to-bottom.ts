"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Lista che resta agganciata in fondo mentre arrivano nuovi elementi, a meno
 * che l'utente non sia risalito a leggere. `trigger` cambia quando cambia il contenuto.
 */
export function useStickToBottom<T extends HTMLElement>(trigger: unknown) {
  const ref = useRef<T>(null);
  const stick = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [trigger]);

  const onScroll = useCallback((event: React.UIEvent<T>) => {
    const el = event.currentTarget;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }, []);

  return { ref, onScroll };
}
