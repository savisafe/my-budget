import type { ParsedFile } from "@/lib/types";
import { parseCsv } from "./csv";
import { parseXlsx } from "./xlsx";
import { parseKaspiPdf } from "./pdfKaspi";

export type FileKind = "csv" | "xlsx" | "pdf" | "unknown";

export function detectKind(file: File): FileKind {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) return "csv";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "xlsx";
  if (name.endsWith(".pdf")) return "pdf";
  if (file.type === "text/csv") return "csv";
  if (file.type === "application/pdf") return "pdf";
  return "unknown";
}

/** Парсит любой поддерживаемый файл в сырой ParsedFile. */
export async function parseFile(file: File): Promise<ParsedFile> {
  const kind = detectKind(file);
  switch (kind) {
    case "csv":
      return parseCsv(file);
    case "xlsx":
      return parseXlsx(file);
    case "pdf":
      // Сейчас поддержан формат Kaspi Gold. Другие PDF вернут пустой результат,
      // и пользователю будет предложено выгрузить CSV/Excel.
      return parseKaspiPdf(file);
    default:
      throw new Error(`Неподдерживаемый тип файла: ${file.name}`);
  }
}

export { parseCsv, parseXlsx, parseKaspiPdf };
