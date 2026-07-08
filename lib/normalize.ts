import type { ColumnMapping, ParsedFile, Transaction } from "@/lib/types";

/** Детерминированный короткий id из полей транзакции (djb2-хэш). */
export function makeTxId(date: string, amount: number, description: string, file: string): string {
  const s = `${date}|${amount.toFixed(2)}|${description}|${file}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return "tx_" + (h >>> 0).toString(36);
}

/**
 * Разбор денежной строки в число с учётом разных форматов.
 * decimalSeparator: "," | "." — явное указание; "auto"/undefined — определить автоматически
 * (последний из символов , или . считается десятичным, если за ним 1-2 цифры).
 */
export function parseAmount(raw: string, decimalSeparator?: "," | "." | "auto"): number {
  if (raw == null) return NaN;
  const original = String(raw).trim();
  if (!original) return NaN;

  const negative = /\(.*\)/.test(original) || original.includes("-");
  const positive = original.includes("+");

  // Оставляем только цифры и разделители.
  let s = original.replace(/[^\d.,]/g, "");
  if (!s) return NaN;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  let dec: "," | "." | "" ;
  if (decimalSeparator === "," || decimalSeparator === ".") {
    dec = decimalSeparator;
  } else if (lastComma >= 0 && lastDot >= 0) {
    // Оба присутствуют — десятичный тот, что правее.
    dec = lastComma > lastDot ? "," : ".";
  } else if (lastComma >= 0) {
    dec = /,\d{1,2}$/.test(s) ? "," : "";
  } else if (lastDot >= 0) {
    dec = /\.\d{1,2}$/.test(s) ? "." : "";
  } else {
    dec = "";
  }

  if (dec === ",") s = s.replace(/\./g, "").replace(/,/g, ".");
  else if (dec === ".") s = s.replace(/,/g, "");
  else s = s.replace(/[.,]/g, ""); // разделителей нет — всё это тысячные

  const n = parseFloat(s);
  if (Number.isNaN(n)) return NaN;

  const abs = Math.abs(n);
  if (negative && !positive) return -abs;
  return abs;
}

/** Разбор даты по формату -> ISO (YYYY-MM-DD). Поддерживает частые форматы. */
export function parseDate(raw: string, format?: string): string {
  if (!raw) return "";
  const s = String(raw).trim();

  // Уже ISO.
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // DD.MM.YYYY / DD/MM/YYYY / DD-MM-YYYY (с 2- или 4-значным годом).
  const dmy = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Попытка через Date.
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return s;
}

/** Возвращает индекс колонки по имени заголовка или по числовому индексу. */
function colIndex(headers: string[], key: string | undefined): number {
  if (key == null || key === "") return -1;
  const byName = headers.findIndex((h) => h.trim().toLowerCase() === key.trim().toLowerCase());
  if (byName >= 0) return byName;
  const n = Number(key);
  return Number.isInteger(n) ? n : -1;
}

/** Применяет ColumnMapping к сырым строкам и возвращает нормализованные транзакции. */
export function normalizeRows(file: ParsedFile, mapping: ColumnMapping): Transaction[] {
  const { headers } = file;
  const dec = mapping.decimalSeparator; // undefined -> авто-определение
  const currency = mapping.currency ?? "KZT";
  const skip = mapping.skipRows ?? 0;

  const iDate = colIndex(headers, mapping.date);
  const iDesc = colIndex(headers, mapping.description);
  const iAmount = colIndex(headers, mapping.amount);
  const iDebit = colIndex(headers, mapping.debit);
  const iCredit = colIndex(headers, mapping.credit);
  const iAccount = colIndex(headers, mapping.account);

  const out: Transaction[] = [];

  file.rows.slice(skip).forEach((row) => {
    const rawDate = iDate >= 0 ? row[iDate] : "";
    const description = (iDesc >= 0 ? row[iDesc] : "")?.toString().trim() || "—";
    if (!rawDate && description === "—") return;

    let amount = NaN;
    if (mapping.amountMode === "debitCredit") {
      const debit = iDebit >= 0 ? parseAmount(row[iDebit], dec) : NaN;
      const credit = iCredit >= 0 ? parseAmount(row[iCredit], dec) : NaN;
      if (!Number.isNaN(credit) && Math.abs(credit) > 0) amount = Math.abs(credit);
      else if (!Number.isNaN(debit) && Math.abs(debit) > 0) amount = -Math.abs(debit);
      else amount = 0;
    } else {
      amount = iAmount >= 0 ? parseAmount(row[iAmount], dec) : NaN;
    }

    if (Number.isNaN(amount)) return;
    if (mapping.invertSign) amount = -amount;

    const date = parseDate(rawDate, mapping.dateFormat);
    if (!date) return;

    const account = iAccount >= 0 ? row[iAccount]?.toString().trim() : undefined;

    out.push({
      id: makeTxId(date, amount, description, file.fileName),
      date,
      amount: Math.round(amount * 100) / 100,
      currency,
      description,
      account: account || undefined,
      bank: mapping.name || file.detectedBank,
      sourceFile: file.fileName,
    });
  });

  return out;
}

/** Эвристическое авто-угадывание маппинга по заголовкам. */
export function guessMapping(headers: string[], bankName = ""): ColumnMapping {
  const lower = headers.map((h) => h.toLowerCase());
  const find = (...cands: string[]) =>
    headers[lower.findIndex((h) => cands.some((c) => h.includes(c)))] ?? "";

  const date = find("дата", "date", "күні", "operation date", "дата операции");
  const description =
    find("назначение", "описание", "детал", "merchant", "магазин", "контрагент", "получатель", "description", "narrative", "purpose") ||
    headers.find((h) => !h.toLowerCase().includes("дата")) ||
    "";
  const debit = find("расход", "дебет", "debit", "списание", "withdrawal");
  const credit = find("приход", "кредит", "credit", "зачисление", "deposit");
  const amount = find("сумма", "amount", "сумма операции", "сома");
  const account = find("счет", "счёт", "карта", "account", "card", "iban");

  const hasDebitCredit = Boolean(debit && credit);

  return {
    name: bankName,
    date,
    description,
    amountMode: hasDebitCredit ? "debitCredit" : "single",
    amount: hasDebitCredit ? undefined : amount,
    debit: hasDebitCredit ? debit : undefined,
    credit: hasDebitCredit ? credit : undefined,
    account: account || undefined,
    decimalSeparator: "auto",
    currency: "KZT",
    skipRows: 0,
  };
}
