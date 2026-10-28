"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Valore che esiste solo nel browser (es. supporto di un'API): durante il
 * prerender e l'idratazione vale `serverValue`, poi quello reale.
 * `getter` deve restituire un valore primitivo o comunque stabile.
 */
export function useClientValue<T>(getter: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, getter, () => serverValue);
}
