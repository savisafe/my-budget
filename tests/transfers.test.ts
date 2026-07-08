import { describe, it, expect } from "vitest";
import { detectTransfers, transferPairId } from "@/lib/transfers";
import type { Transaction } from "@/lib/types";

function tx(over: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    date: "2025-02-07",
    amount: 0,
    currency: "KZT",
    description: "",
    sourceFile: "a.csv",
    bank: "A",
    ...over,
  };
}

describe("detectTransfers", () => {
  it("находит встречную пару одинаковой суммы из разных файлов", () => {
    const out = tx({ amount: -100000, sourceFile: "halyk.csv", bank: "Halyk" });
    const inc = tx({ amount: 100000, sourceFile: "kaspi.csv", bank: "Kaspi", date: "2025-02-07" });
    const pairs = detectTransfers([out, inc]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].amount).toBe(100000);
    expect(pairs[0].outId).toBe(out.id);
    expect(pairs[0].inId).toBe(inc.id);
    expect(pairs[0].status).toBe("candidate");
  });

  it("не парит операции из одного и того же файла/счёта", () => {
    const out = tx({ amount: -5000, sourceFile: "a.csv", bank: "A", account: "1" });
    const inc = tx({ amount: 5000, sourceFile: "a.csv", bank: "A", account: "1" });
    expect(detectTransfers([out, inc])).toHaveLength(0);
  });

  it("не парит при слишком большой разнице дат", () => {
    const out = tx({ amount: -5000, sourceFile: "a.csv", date: "2025-02-01" });
    const inc = tx({ amount: 5000, sourceFile: "b.csv", date: "2025-02-20" });
    expect(detectTransfers([out, inc], { maxDaysApart: 3 })).toHaveLength(0);
  });

  it("уважает допуск по сумме", () => {
    const out = tx({ amount: -1000, sourceFile: "a.csv" });
    const inc = tx({ amount: 1000.4, sourceFile: "b.csv" });
    expect(detectTransfers([out, inc], { amountTolerance: 0.5 })).toHaveLength(1);
    expect(detectTransfers([out, inc], { amountTolerance: 0.1 })).toHaveLength(0);
  });

  it("сопоставляет один-к-одному (без переиспользования зачисления)", () => {
    const out1 = tx({ amount: -100, sourceFile: "a.csv" });
    const out2 = tx({ amount: -100, sourceFile: "a.csv" });
    const inc = tx({ amount: 100, sourceFile: "b.csv" });
    const pairs = detectTransfers([out1, out2, inc]);
    expect(pairs).toHaveLength(1);
  });
});

describe("transferPairId", () => {
  it("не зависит от порядка аргументов", () => {
    expect(transferPairId("a", "b")).toBe(transferPairId("b", "a"));
  });
});
