"use client";

import { useI18n } from "@/lib/i18n/context";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className={"flex items-center gap-1 text-sm " + className}>
      <span className="sr-only">{t("nav.language")}</span>
      <span aria-hidden className="text-muted">🌐</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t("nav.language")}
        className="surface rounded-lg border px-2 py-1"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
