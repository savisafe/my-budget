import { describe, it, expect } from "vitest";
import { linesToTable, detectBankName, type PdfLine } from "@/lib/parsers/pdfTable";
import { parseKaspiText } from "@/lib/parsers/pdfKaspi";

/** Хелпер: строит строку PDF из ячеек с координатой X (ширина ~ длине текста). */
function line(y: number, cells: { x: number; str: string; w?: number }[]): PdfLine {
  return {
    page: 1,
    y,
    words: cells.map((c) => ({ x: c.x, str: c.str, w: c.w ?? c.str.length * 5 })),
  };
}

describe("linesToTable", () => {
  it("выравнивает данные по строке-шапке (любой банк)", () => {
    const lines: PdfLine[] = [
      line(700, [
        { x: 50, str: "Дата" },
        { x: 130, str: "Операция" },
        { x: 320, str: "Сумма" },
      ]),
      line(680, [
        { x: 50, str: "01.02.2025", w: 50 },
        { x: 130, str: "Magnum", w: 30 },
        { x: 165, str: "Астана", w: 30 },
        { x: 320, str: "-5000,00", w: 40 },
      ]),
      line(660, [
        { x: 50, str: "02.02.2025", w: 50 },
        { x: 130, str: "Зарплата", w: 40 },
        { x: 320, str: "+450000,00", w: 50 },
      ]),
    ];

    const table = linesToTable(lines);
    expect(table.headers).toEqual(["Дата", "Операция", "Сумма"]);
    expect(table.rows).toEqual([
      ["01.02.2025", "Magnum Астана", "-5000,00"],
      ["02.02.2025", "Зарплата", "+450000,00"],
    ]);
  });

  it("без шапки синтезирует колонки по частоте ячеек", () => {
    const lines: PdfLine[] = [
      line(700, [
        { x: 50, str: "01.02.2025", w: 50 },
        { x: 130, str: "Кофе", w: 20 },
        { x: 320, str: "-1200,00", w: 40 },
      ]),
      line(680, [
        { x: 50, str: "02.02.2025", w: 50 },
        { x: 130, str: "Такси", w: 25 },
        { x: 320, str: "-3000,00", w: 40 },
      ]),
    ];

    const table = linesToTable(lines);
    expect(table.headers).toEqual(["Колонка 1", "Колонка 2", "Колонка 3"]);
    expect(table.rows).toEqual([
      ["01.02.2025", "Кофе", "-1200,00"],
      ["02.02.2025", "Такси", "-3000,00"],
    ]);
  });

  it("пустой ввод даёт пустую таблицу", () => {
    expect(linesToTable([])).toEqual({ headers: [], rows: [] });
  });
});

describe("detectBankName", () => {
  it("узнаёт известные банки", () => {
    expect(detectBankName("Halyk Bank · выписка по счёту")).toBe("Halyk Bank");
    expect(detectBankName("АО «Kaspi Bank» Kaspi Gold")).toBe("Kaspi Gold");
    expect(detectBankName("ForteBank выписка")).toBe("ForteBank");
  });

  it("возвращает undefined для неизвестного", () => {
    expect(detectBankName("Some random text")).toBeUndefined();
  });
});

describe("parseKaspiText (регресс)", () => {
  it("парсит строки выписки Kaspi Gold", () => {
    const text =
      "01.02.25 - 5 000,00 ₸ Покупка Magnum 02.02.25 + 450 000,00 ₸ Пополнение Зарплата";
    const rows = parseKaspiText(text);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ dateIso: "2025-02-01", type: "Покупка", store: "Magnum" });
    expect(rows[1]).toMatchObject({ dateIso: "2025-02-02", type: "Пополнение" });
  });
});
