import type { ParsedFile, Transaction } from "@/lib/types";
import { makeTxId } from "@/lib/normalize";

/**
 * Извлекает текст из PDF на клиенте через pdfjs-dist и парсит выписку Kaspi Gold.
 * Логика распознавания перенесена из старого server.js:parsePDFText и упрощена.
 */
export async function parseKaspiPdf(file: File): Promise<ParsedFile> {
  const text = await extractPdfText(file);
  const raw = parseKaspiText(text);

  const preNormalized: Transaction[] = raw.map((r) => {
    const amount = parseKaspiAmount(r.amount);
    return {
      id: makeTxId(r.date, amount, r.store, file.name),
      date: r.dateIso,
      amount,
      currency: "KZT",
      description: r.store,
      rawType: r.type,
      bank: "Kaspi Gold",
      sourceFile: file.name,
    };
  });

  return {
    fileName: file.name,
    headers: ["Дата", "Сумма", "Тип", "Магазин"],
    rows: raw.map((r) => [r.date, r.amount, r.type, r.store]),
    detectedBank: "Kaspi Gold",
    preNormalized,
  };
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Воркер как ассет webpack 5 (эмитится в бандл, работает офлайн).
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    text += pageText + "\n";
  }
  return text;
}

interface RawKaspiRow {
  date: string; // DD.MM.YY как в выписке
  dateIso: string;
  amount: string;
  type: string;
  store: string;
}

/** Парсит "- 23 456,00 ₸" / "+ 15 000,00 ₸" -> число (тыйыны учтены как копейки). */
function parseKaspiAmount(raw: string): number {
  const sign = raw.includes("+") ? 1 : -1;
  const digits = raw.replace(/[^\d]/g, ""); // "2345600"
  if (!digits) return 0;
  const value = parseInt(digits, 10) / 100;
  return Math.round(value * sign * 100) / 100;
}

/** DD.MM.YY -> YYYY-MM-DD. */
function kaspiDateToIso(d: string): string {
  const m = d.match(/(\d{2})\.(\d{2})\.(\d{2,4})/);
  if (!m) return d;
  const [, dd, mm, yy] = m;
  const year = yy.length === 2 ? `20${yy}` : yy;
  return `${year}-${mm}-${dd}`;
}

/** Основной парсер текста выписки Kaspi Gold. */
export function parseKaspiText(text: string): RawKaspiRow[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows: RawKaspiRow[] = [];
  const fullText = lines.join(" ");

  const pattern =
    /(\d{2}\.\d{2}\.\d{2})\s*([+-]\s*[\d\s]+,\d{2}\s*₸)\s+(Покупка|Пополнение|Перевод|Снятие)\s+(.+?)(?=\d{2}\.\d{2}\.\d{2}|$)/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(fullText)) !== null) {
    const [, date, amount, type, storeRaw] = match;
    const store = storeRaw.trim();
    if (store && store.length > 1 && !store.includes("Выписка") && !store.includes("Доступно")) {
      rows.push({ date, dateIso: kaspiDateToIso(date), amount: amount.trim(), type, store });
    }
  }

  if (rows.length > 0) return rows;

  // Fallback: построчный анализ.
  const linePattern =
    /^(\d{2}\.\d{2}\.\d{2})\s*([+-]\s*[\d\s]+,\d{2}\s*₸)\s+(Покупка|Пополнение|Перевод|Снятие)\s+(.+)$/;
  for (const line of lines) {
    const m = line.match(linePattern);
    if (m) {
      const [, date, amount, type, storeRaw] = m;
      const store = storeRaw.trim();
      if (store && store.length > 1) {
        rows.push({ date, dateIso: kaspiDateToIso(date), amount: amount.trim(), type, store });
      }
    }
  }

  return rows;
}
