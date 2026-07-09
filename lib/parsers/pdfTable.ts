/**
 * Чистая (без pdfjs/браузера) логика реконструкции таблицы выписки из
 * позиционированных строк PDF. Используется для банков, у которых нет
 * специализированного парсера: восстановленная таблица уходит в тот же
 * шаг сопоставления колонок (ColumnMapper), что и CSV/Excel.
 */

export interface PdfWord {
  /** Координата X начала элемента. */
  x: number;
  /** Ширина элемента (для склейки слов в ячейки). */
  w: number;
  str: string;
}

export interface PdfLine {
  page: number;
  y: number;
  words: PdfWord[];
}

export interface PdfTable {
  headers: string[];
  rows: string[][];
}

/** Ключевые слова заголовков выписок (RU/KZ/EN) для поиска строки-шапки. */
const HEADER_KEYWORDS = [
  "дата",
  "date",
  "күні",
  "сумма",
  "amount",
  "сома",
  "описание",
  "детал",
  "назначение",
  "operation",
  "операц",
  "приход",
  "расход",
  "дебет",
  "кредит",
  "debit",
  "credit",
  "баланс",
  "balance",
  "остаток",
  "счет",
  "счёт",
  "account",
  "получатель",
  "контрагент",
  "merchant",
];

/** Известные банки РК — для авто-подстановки имени в пресет сопоставления. */
const BANK_SIGNATURES: { name: string; patterns: RegExp[] }[] = [
  { name: "Kaspi Gold", patterns: [/kaspi/i, /каспи/i] },
  { name: "Halyk Bank", patterns: [/halyk/i, /халык/i, /народн[ыо]/i] },
  { name: "ForteBank", patterns: [/forte/i, /форте/i] },
  { name: "Jusan Bank", patterns: [/jusan/i, /жусан/i] },
  { name: "Bank CenterCredit", patterns: [/centercredit/i, /центркредит/i, /\bbcc\b/i] },
  { name: "Freedom Bank", patterns: [/freedom/i, /фридом/i] },
  { name: "Bereke Bank", patterns: [/bereke/i, /береке/i] },
  { name: "Eurasian Bank", patterns: [/eurasian/i, /евразийск/i] },
  { name: "RBK Bank", patterns: [/\brbk\b/i] },
  { name: "Altyn Bank", patterns: [/altyn/i, /алтын/i] },
  { name: "Sberbank", patterns: [/сбербанк/i, /sberbank/i] },
  { name: "Tinkoff", patterns: [/тинькофф/i, /tinkoff/i, /т-банк/i] },
];

/** Пытается определить банк по тексту выписки (для подписи пресета). */
export function detectBankName(text: string): string | undefined {
  for (const b of BANK_SIGNATURES) {
    if (b.patterns.some((p) => p.test(text))) return b.name;
  }
  return undefined;
}

/** Ячейка строки после склейки слов: диапазон X и текст. */
interface Cell {
  x0: number;
  x1: number;
  text: string;
}

/**
 * Склеивает слова строки в ячейки: пробел шире порога считается границей
 * колонки. Порог берётся относительно ширины элементов, чтобы не зависеть
 * от размера шрифта/масштаба страницы.
 */
function lineToCells(line: PdfLine): Cell[] {
  const words = line.words;
  if (words.length === 0) return [];

  // Медианная ширина символа как масштаб; зазор колонки — заметно больше пробела.
  const avgCharW = medianCharWidth(words);
  const gap = Math.max(avgCharW * 2.5, 8);

  const cells: Cell[] = [];
  let cur: Cell | null = null;
  let prevEnd = -Infinity;

  for (const w of words) {
    const end = w.x + (w.w || estimateWidth(w.str, avgCharW));
    if (cur && w.x - prevEnd <= gap) {
      cur.text += (needsSpace(cur.text, w.str) ? " " : "") + w.str;
      cur.x1 = end;
    } else {
      if (cur) cells.push(cur);
      cur = { x0: w.x, x1: end, text: w.str };
    }
    prevEnd = end;
  }
  if (cur) cells.push(cur);

  return cells.map((c) => ({ ...c, text: c.text.trim() })).filter((c) => c.text.length > 0);
}

function needsSpace(prev: string, next: string): boolean {
  if (!prev) return false;
  return !prev.endsWith(" ") && !next.startsWith(" ");
}

function medianCharWidth(words: PdfWord[]): number {
  const widths: number[] = [];
  for (const w of words) {
    const len = w.str.length || 1;
    if (w.w > 0) widths.push(w.w / len);
  }
  if (widths.length === 0) return 4; // разумный дефолт в единицах PDF
  widths.sort((a, b) => a - b);
  return widths[Math.floor(widths.length / 2)];
}

function estimateWidth(str: string, charW: number): number {
  return str.length * charW;
}

/** Похожа ли строка на шапку таблицы (совпадений с ключевыми словами >= 2). */
function headerScore(cells: Cell[]): number {
  let score = 0;
  for (const c of cells) {
    const lc = c.text.toLowerCase();
    if (HEADER_KEYWORDS.some((k) => lc.includes(k))) score++;
  }
  return score;
}

/**
 * Реконструирует таблицу из строк PDF.
 * 1. Каждая строка → ячейки (склейка по зазорам).
 * 2. Ищется строка-шапка по ключевым словам заголовков.
 * 3. Если шапка найдена — данные выравниваются по её колонкам; иначе колонки
 *    берутся из наиболее частого числа ячеек, заголовки синтезируются.
 */
export function linesToTable(lines: PdfLine[]): PdfTable {
  const perLine = lines.map((l) => lineToCells(l)).filter((c) => c.length > 0);
  if (perLine.length === 0) return { headers: [], rows: [] };

  // Ищем строку-шапку среди первых строк документа.
  let headerIdx = -1;
  let bestScore = 1; // требуем минимум 2 совпадения
  const scanLimit = Math.min(perLine.length, 40);
  for (let i = 0; i < scanLimit; i++) {
    const s = headerScore(perLine[i]);
    if (s > bestScore) {
      bestScore = s;
      headerIdx = i;
    }
  }

  if (headerIdx >= 0 && perLine[headerIdx].length >= 2) {
    return buildFromHeader(perLine, headerIdx);
  }
  return buildFromColumns(perLine);
}

/** Выравнивание ячеек данных по колонкам строки-шапки (по центрам X). */
function buildFromHeader(perLine: Cell[][], headerIdx: number): PdfTable {
  const headerCells = perLine[headerIdx];
  const headers = headerCells.map((c) => c.text);
  const centers = headerCells.map((c) => (c.x0 + c.x1) / 2);

  const rows: string[][] = [];
  for (let i = headerIdx + 1; i < perLine.length; i++) {
    const cells = perLine[i];
    const row = new Array<string>(headers.length).fill("");
    for (const cell of cells) {
      const center = (cell.x0 + cell.x1) / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let k = 0; k < centers.length; k++) {
        const d = Math.abs(centers[k] - center);
        if (d < bestDist) {
          bestDist = d;
          best = k;
        }
      }
      row[best] = row[best] ? `${row[best]} ${cell.text}` : cell.text;
    }
    if (row.filter((v) => v.trim()).length >= 2) rows.push(row);
  }

  return { headers, rows };
}

/**
 * Без шапки: число колонок = самое частое число ячеек в строке; колонки —
 * кластеры по X начал ячеек. Заголовки синтезируются ("Колонка N").
 */
function buildFromColumns(perLine: Cell[][]): PdfTable {
  // Модальное число ячеек среди строк, где их >= 2 (данные, а не заголовки/подписи).
  const counts = new Map<number, number>();
  for (const cells of perLine) {
    if (cells.length >= 2) counts.set(cells.length, (counts.get(cells.length) ?? 0) + 1);
  }
  if (counts.size === 0) return { headers: [], rows: [] };

  let modalCols = 2;
  let modalFreq = 0;
  for (const [n, f] of counts) {
    if (f > modalFreq || (f === modalFreq && n > modalCols)) {
      modalFreq = f;
      modalCols = n;
    }
  }

  // Собираем якоря колонок из строк с модальным числом ячеек.
  const anchorLines = perLine.filter((c) => c.length === modalCols);
  const anchors = new Array<number>(modalCols).fill(0);
  for (const cells of anchorLines) {
    cells.forEach((c, k) => {
      anchors[k] += (c.x0 + c.x1) / 2;
    });
  }
  for (let k = 0; k < modalCols; k++) anchors[k] /= anchorLines.length || 1;

  const rows: string[][] = [];
  for (const cells of perLine) {
    if (cells.length < 2) continue;
    const row = new Array<string>(modalCols).fill("");
    for (const cell of cells) {
      const center = (cell.x0 + cell.x1) / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let k = 0; k < modalCols; k++) {
        const d = Math.abs(anchors[k] - center);
        if (d < bestDist) {
          bestDist = d;
          best = k;
        }
      }
      row[best] = row[best] ? `${row[best]} ${cell.text}` : cell.text;
    }
    if (row.filter((v) => v.trim()).length >= 2) rows.push(row);
  }

  const headers = Array.from({ length: modalCols }, (_, i) => `Колонка ${i + 1}`);
  return { headers, rows };
}
