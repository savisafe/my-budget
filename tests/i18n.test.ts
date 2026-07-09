import { describe, it, expect } from "vitest";
import { translations } from "@/lib/i18n/translations";
import { LOCALES, INTL_LOCALE, isLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { CATEGORIES } from "@/lib/categorize/categories";

describe("i18n translations", () => {
  const ru = Object.keys(translations.ru).sort();

  it("все локали имеют одинаковый набор ключей", () => {
    for (const loc of LOCALES) {
      expect(Object.keys(translations[loc]).sort()).toEqual(ru);
    }
  });

  it("нет пустых значений", () => {
    for (const loc of LOCALES) {
      for (const [key, val] of Object.entries(translations[loc])) {
        expect(val, `${loc}.${key}`).toBeTruthy();
      }
    }
  });

  it("для каждой категории есть перевод во всех локалях", () => {
    for (const c of CATEGORIES) {
      for (const loc of LOCALES) {
        expect(translations[loc][`cat.${c.id}`], `${loc}.cat.${c.id}`).toBeTruthy();
      }
    }
  });

  it("плейсхолдеры {n}/{name} присутствуют одинаково во всех локалях", () => {
    const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort();
    for (const key of ru) {
      const base = placeholders(translations.ru[key]);
      for (const loc of LOCALES) {
        expect(placeholders(translations[loc][key]), `${loc}.${key}`).toEqual(base);
      }
    }
  });
});

describe("i18n config", () => {
  it("isLocale", () => {
    expect(isLocale("ru")).toBe(true);
    expect(isLocale("kk")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  it("INTL_LOCALE есть для всех локалей", () => {
    for (const loc of LOCALES) {
      expect(INTL_LOCALE[loc]).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    }
  });

  it("дефолтная локаль валидна", () => {
    expect(isLocale(DEFAULT_LOCALE)).toBe(true);
  });
});
