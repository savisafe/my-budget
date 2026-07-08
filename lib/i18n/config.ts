export const LOCALES = ["ru", "kk", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = {
  ru: "Русский",
  kk: "Қазақша",
  en: "English",
};

/** Соответствие локали приложения BCP-47 для Intl (числа/даты). */
export const INTL_LOCALE: Record<Locale, string> = {
  ru: "ru-RU",
  kk: "kk-KZ",
  en: "en-US",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Определяет локаль по языку браузера (navigator.languages). */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  for (const l of langs) {
    const code = l.toLowerCase().split("-")[0];
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}
