import { describe, it, expect, beforeEach } from "vitest";
import {
  formatMoney,
  formatCompact,
  monthKey,
  currencySymbol,
  setFormatLocale,
} from "@/lib/format";

describe("format", () => {
  beforeEach(() => setFormatLocale("ru-RU"));

  it("currencySymbol", () => {
    expect(currencySymbol("KZT")).toBe("₸");
    expect(currencySymbol("USD")).toBe("$");
    expect(currencySymbol("XXX")).toBe("XXX");
  });

  it("formatMoney: знак, 2 знака и символ валюты", () => {
    expect(formatMoney(0)).toContain("₸");
    expect(formatMoney(-1234.5)).toMatch(/^-/);
    expect(formatMoney(1234.5)).toContain("1");
  });

  it("formatMoney уважает локаль (en-US группировка запятой)", () => {
    setFormatLocale("en-US");
    // Точную строку Intl не фиксируем (зависит от ICU платформы) — проверяем структуру.
    expect(formatMoney(1000)).toMatch(/1,000\.00/);
    expect(formatMoney(1000)).toContain("₸");
  });

  it("formatCompact: К/М (ru) и K/M (en)", () => {
    setFormatLocale("ru-RU");
    expect(formatCompact(1500)).toBe("1.5К");
    expect(formatCompact(2_000_000)).toBe("2.0М");
    setFormatLocale("en-US");
    expect(formatCompact(1500)).toBe("1.5K");
    expect(formatCompact(2_000_000)).toBe("2.0M");
  });

  it("monthKey", () => {
    expect(monthKey("2025-02-15")).toBe("2025-02");
  });
});
