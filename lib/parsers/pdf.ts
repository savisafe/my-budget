import type { ParsedFile } from "@/lib/types";
import { extractPdfLines, linesToText } from "./pdfText";
import { linesToTable, detectBankName } from "./pdfTable";
import { buildKaspiParsedFile, parseKaspiText } from "./pdfKaspi";

/**
 * Универсальный разбор PDF-выписки любого банка.
 *
 * 1. Пробуем известные форматы с авто-распознаванием (Kaspi Gold) — они сразу
 *    отдают нормализованные транзакции (preNormalized).
 * 2. Иначе реконструируем таблицу из координат текста и отправляем её на шаг
 *    сопоставления колонок — тот же путь, что у CSV/Excel. Так поддерживается
 *    выписка в PDF от любого банка.
 */
export async function parsePdf(file: File): Promise<ParsedFile> {
  const lines = await extractPdfLines(file);
  const text = linesToText(lines);

  // 1. Известные форматы с прямым распознаванием.
  if (parseKaspiText(text).length > 0) {
    return buildKaspiParsedFile(text, file.name);
  }

  // 2. Универсальный путь: таблица → сопоставление колонок.
  const table = linesToTable(lines);
  return {
    fileName: file.name,
    headers: table.headers,
    rows: table.rows,
    detectedBank: detectBankName(text),
  };
}
