"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, detectLocale, INTL_LOCALE, isLocale, type Locale } from "./config";
import { translations } from "./translations";
import { setFormatLocale } from "@/lib/format";

type TParams = Record<string, string | number>;

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: TParams) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

const STORAGE_KEY = "locale";

function interpolate(str: string, params?: TParams): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // На сервере и при первом рендере — дефолт, чтобы не было рассинхрона гидрации.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    // Клиент: сохранённый выбор -> язык браузера.
    let initial: Locale = DEFAULT_LOCALE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      initial = isLocale(saved) ? saved : detectLocale();
    } catch {
      initial = detectLocale();
    }
    setLocaleState(initial);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale;
    setFormatLocale(INTL_LOCALE[locale]);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, params?: TParams) => {
      const dict = translations[locale] ?? translations[DEFAULT_LOCALE];
      const value = dict[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
      return interpolate(value, params);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
