import Papa from "papaparse";
import type { ParsedFile } from "@/lib/types";

/** Парсит CSV/TSV в сырые строки. Разделитель определяется автоматически. */
export async function parseCsv(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const result = Papa.parse<string[]>(text, {
    skipEmptyLines: "greedy",
    delimiter: "", // авто-детект
  });

  const rows = (result.data as unknown as string[][]).filter(
    (r) => Array.isArray(r) && r.some((c) => String(c).trim() !== ""),
  );

  const headers = rows.length > 0 ? rows[0].map((h) => String(h).trim()) : [];

  return {
    fileName: file.name,
    headers,
    rows: rows.slice(1),
  };
}
