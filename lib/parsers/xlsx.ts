import * as XLSX from "xlsx";
import type { ParsedFile } from "@/lib/types";

// TODO(security): пакет `xlsx` из npm имеет известные уязвимости (prototype
// pollution / ReDoS) и не обновляется в реестре. Мы парсим ПОЛЬЗОВАТЕЛЬСКИЕ файлы
// (хоть и целиком на клиенте, без сервера — радиус поражения ограничен вкладкой).
// Перед продом заменить на актуальную сборку SheetJS с их CDN (https://cdn.sheetjs.com)
// или на альтернативу (exceljs) и добавить ограничение размера/таймаут парсинга.

/** Парсит Excel (.xlsx/.xls) в сырые строки. Берётся первый лист. */
export async function parseXlsx(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];

  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  }) as unknown as string[][];

  const rows = matrix.filter((r) => Array.isArray(r) && r.some((c) => String(c).trim() !== ""));
  const headers = rows.length > 0 ? rows[0].map((h) => String(h).trim()) : [];

  return {
    fileName: file.name,
    headers,
    rows: rows.slice(1),
  };
}
