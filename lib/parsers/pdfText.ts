import type { PdfLine, PdfWord } from "./pdfTable";

/**
 * Извлекает текст из PDF на клиенте через pdfjs-dist, сохраняя координаты
 * элементов. На основе координат восстанавливаются визуальные строки —
 * это позволяет реконструировать таблицу выписки любого банка.
 *
 * Модуль работает только в браузере (pdfjs тянет worker). Чистая логика
 * разбора вынесена в pdfTable.ts и тестируется отдельно.
 */

/** Восстанавливает визуальные строки (с координатами слов) из всех страниц PDF. */
export async function extractPdfLines(file: File): Promise<PdfLine[]> {
  const pdfjs = await import("pdfjs-dist");
  // Воркер как ассет webpack 5 (эмитится в бандл, работает офлайн).
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;

  const lines: PdfLine[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    // Собираем элементы с координатами (transform[4]=x, transform[5]=y).
    const items = content.items
      .map((item) => {
        if (!("str" in item) || !("transform" in item)) return null;
        const str = item.str;
        if (!str || !str.trim()) return null;
        const tr = item.transform as number[];
        const w = "width" in item && typeof item.width === "number" ? item.width : 0;
        return { x: tr[4], y: tr[5], w, str };
      })
      .filter((it): it is { x: number; y: number; w: number; str: string } => it !== null);

    lines.push(...groupIntoLines(items, p));
  }

  return lines;
}

/** Группирует элементы одной страницы в строки по близости координаты Y. */
function groupIntoLines(
  items: { x: number; y: number; w: number; str: string }[],
  page: number,
): PdfLine[] {
  if (items.length === 0) return [];

  // Порог "одной строки" — доля от типичной высоты текста. У pdfjs Y растёт
  // вверх; элементы одной строки имеют почти одинаковый Y.
  const Y_TOLERANCE = 3;

  // Сортируем сверху вниз, затем слева направо.
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: PdfLine[] = [];
  let current: { y: number; words: PdfWord[] } | null = null;

  for (const it of sorted) {
    if (current && Math.abs(current.y - it.y) <= Y_TOLERANCE) {
      current.words.push({ x: it.x, w: it.w, str: it.str });
    } else {
      if (current) lines.push(finalizeLine(current, page));
      current = { y: it.y, words: [{ x: it.x, w: it.w, str: it.str }] };
    }
  }
  if (current) lines.push(finalizeLine(current, page));

  return lines;
}

function finalizeLine(line: { y: number; words: PdfWord[] }, page: number): PdfLine {
  const words = [...line.words].sort((a, b) => a.x - b.x);
  return { page, y: line.y, words };
}

/** Плоский текст всех строк — для текстовых парсеров (напр. Kaspi). */
export function linesToText(lines: PdfLine[]): string {
  return lines.map((l) => l.words.map((w) => w.str).join(" ")).join("\n");
}
