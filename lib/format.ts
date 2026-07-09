// Форматирование денег и дат.

// Текущая локаль для Intl (устанавливается I18nProvider через setFormatLocale).
let intlLocale = "en-US";
export function setFormatLocale(bcp47: string) {
  intlLocale = bcp47;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  KZT: "₸",
  USD: "$",
  EUR: "€",
  RUB: "₽",
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

/** "12 345,67 ₸" — группировка тысяч пробелом, 2 знака. */
export function formatMoney(value: number, currency = "KZT"): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString(intlLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${formatted} ${currencySymbol(currency)}`;
}

/** Компактный формат для осей графиков: 12,3К / 1,2М. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const latin = intlLocale.startsWith("en");
  const M = latin ? "M" : "М";
  const K = latin ? "K" : "К";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}${M}`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}${K}`;
  return `${sign}${abs.toFixed(0)}`;
}

/** ISO (YYYY-MM-DD) -> "12 фев 2025". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(intlLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "2025-02" -> "Фев 2025". */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  const label = d.toLocaleDateString(intlLocale, { month: "short", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Ключ месяца из ISO-даты: "2025-02". */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}
