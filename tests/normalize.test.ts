import { describe, it, expect } from "vitest";
import {
  parseAmount,
  parseDate,
  makeTxId,
  guessMapping,
  normalizeRows,
} from "@/lib/normalize";
import type { ParsedFile } from "@/lib/types";

describe("parseAmount", () => {
  it("парсит точку как десятичный разделитель (авто)", () => {
    expect(parseAmount("15000.50")).toBe(15000.5);
    expect(parseAmount("-8700.00")).toBe(-8700);
    expect(parseAmount("+100000.00")).toBe(100000);
  });

  it("парсит запятую как десятичный разделитель (авто)", () => {
    expect(parseAmount("15 000,50")).toBe(15000.5);
    expect(parseAmount("1 234,56 ₸")).toBe(1234.56);
  });

  it("различает тысячные и десятичные при обоих разделителях", () => {
    expect(parseAmount("1.234.567,89")).toBe(1234567.89); // eu
    expect(parseAmount("1,234,567.89")).toBe(1234567.89); // us
  });

  it("трактует одиночную группу из 3 цифр как тысячные, а не дробь", () => {
    expect(parseAmount("1,234")).toBe(1234);
    expect(parseAmount("1.234")).toBe(1234);
  });

  it("уважает явный разделитель", () => {
    expect(parseAmount("1,234", ",")).toBe(1.234);
    expect(parseAmount("1.234", ".")).toBe(1.234);
  });

  it("определяет отрицательные (минус и скобки)", () => {
    expect(parseAmount("-1 000,00")).toBe(-1000);
    expect(parseAmount("(1 000,00)")).toBe(-1000);
  });

  it("возвращает NaN на мусоре", () => {
    expect(Number.isNaN(parseAmount(""))).toBe(true);
    expect(Number.isNaN(parseAmount("—"))).toBe(true);
  });
});

describe("parseDate", () => {
  it("оставляет ISO как есть", () => {
    expect(parseDate("2025-02-01")).toBe("2025-02-01");
  });
  it("парсит DD.MM.YYYY и DD/MM/YY", () => {
    expect(parseDate("01.02.2025")).toBe("2025-02-01");
    expect(parseDate("1/2/25")).toBe("2025-02-01");
    expect(parseDate("07-03-2024")).toBe("2024-03-07");
  });
});

describe("makeTxId", () => {
  it("стабилен для одинаковых входов", () => {
    expect(makeTxId("2025-02-01", -100, "Shop", "a.csv", 0)).toBe(
      makeTxId("2025-02-01", -100, "Shop", "a.csv", 0),
    );
  });
  it("различает идентичные операции по индексу строки", () => {
    expect(makeTxId("2025-02-01", -100, "Shop", "a.csv", 0)).not.toBe(
      makeTxId("2025-02-01", -100, "Shop", "a.csv", 1),
    );
  });
});

describe("guessMapping", () => {
  it("определяет режим debit/credit по заголовкам", () => {
    const m = guessMapping(["Дата", "Описание", "Расход", "Приход", "Счёт"], "Halyk");
    expect(m.amountMode).toBe("debitCredit");
    expect(m.date).toBe("Дата");
    expect(m.debit).toBe("Расход");
    expect(m.credit).toBe("Приход");
    expect(m.name).toBe("Halyk");
  });
  it("определяет режим single по одной колонке суммы", () => {
    const m = guessMapping(["Дата", "Описание", "Сумма", "Счёт"]);
    expect(m.amountMode).toBe("single");
    expect(m.amount).toBe("Сумма");
  });
});

describe("normalizeRows", () => {
  const file: ParsedFile = {
    fileName: "halyk.csv",
    headers: ["Дата", "Описание", "Расход", "Приход", "Счёт"],
    rows: [
      ["01.02.2025", "Magnum", "15000.50", "", "KZT-1"],
      ["05.02.2025", "Зарплата", "", "450000.00", "KZT-1"],
    ],
  };

  it("нормализует debit/credit со знаками и суммами", () => {
    const m = guessMapping(file.headers, "Halyk");
    const txs = normalizeRows(file, m);
    expect(txs).toHaveLength(2);
    expect(txs[0].amount).toBe(-15000.5);
    expect(txs[0].description).toBe("Magnum");
    expect(txs[0].date).toBe("2025-02-01");
    expect(txs[0].bank).toBe("Halyk");
    expect(txs[1].amount).toBe(450000);
  });

  it("даёт разные id для идентичных строк в одном файле", () => {
    const dupFile: ParsedFile = {
      ...file,
      rows: [
        ["01.02.2025", "Coffee", "1500.00", "", "KZT-1"],
        ["01.02.2025", "Coffee", "1500.00", "", "KZT-1"],
      ],
    };
    const txs = normalizeRows(dupFile, guessMapping(dupFile.headers));
    expect(txs).toHaveLength(2);
    expect(txs[0].id).not.toBe(txs[1].id);
  });
});
