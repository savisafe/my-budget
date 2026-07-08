"use client";

import { useEffect } from "react";
import { useBudget } from "@/lib/store";

/** Загружает данные из IndexedDB в стор при старте приложения. */
export function StoreHydrator() {
  const load = useBudget((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);
  return null;
}
