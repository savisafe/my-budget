import { describe, it, expect } from "vitest";
import {
  applyFilters,
  computeKpis,
  expensesByCategory,
  byMonth,
  topMerchants,
  byAccount,
  accountOptions,
  dateRange,
} from "@/lib/analytics";
import type { Transaction } from "@/lib/types";

function tx(over: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    date: "2025-02-10",
    amount: 0,
    currency: "KZT",
    description: "",
    sourceFile: "a.csv",
    bank: "A",
    ...over,
  };
}

const data: Transaction[] = [
  tx({ amount: 450000, category: "salary", date: "2025-02-05", bank: "Halyk" }),
  tx({ amount: -15000, category: "groceries", date: "2025-02-01", bank: "Halyk", description: "Magnum" }),
  tx({ amount: -5000, category: "groceries", date: "2025-03-02", bank: "Kaspi", description: "Magnum" }),
  tx({ amount: -100000, isTransfer: true, date: "2025-02-07", bank: "Halyk" }), // исключается
];

describe("applyFilters", () => {
  it("исключает переводы всегда", () => {
    expect(applyFilters(data, {}).some((t) => t.isTransfer)).toBe(false);
  });
  it("фильтрует по диапазону дат", () => {
    const r = applyFilters(data, { from: "2025-03-01", to: "2025-03-31" });
    expect(r).toHaveLength(1);
    expect(r[0].amount).toBe(-5000);
  });
  it("фильтрует по счёту и категории", () => {
    expect(applyFilters(data, { account: "Kaspi" })).toHaveLength(1);
    expect(applyFilters(data, { category: "salary" })).toHaveLength(1);
  });
});

describe("computeKpis", () => {
  it("считает доход/расход/нетто/норму без переводов", () => {
    const k = computeKpis(applyFilters(data, {}));
    expect(k.income).toBe(450000);
    expect(k.expense).toBe(20000);
    expect(k.net).toBe(430000);
    expect(k.savingsRate).toBeCloseTo(430000 / 450000, 5);
    expect(k.count).toBe(3);
  });
});

describe("aggregations", () => {
  it("expensesByCategory суммирует по категории", () => {
    const cats = expensesByCategory(applyFilters(data, {}));
    const groceries = cats.find((c) => c.id === "groceries");
    expect(groceries?.value).toBe(20000);
  });
  it("byMonth группирует по месяцам", () => {
    const months = byMonth(applyFilters(data, {}));
    expect(months.map((m) => m.month)).toEqual(["2025-02", "2025-03"]);
    expect(months[0].income).toBe(450000);
    expect(months[0].expense).toBe(15000);
  });
  it("topMerchants агрегирует траты по мерчанту", () => {
    const m = topMerchants(applyFilters(data, {}));
    const magnum = m.find((x) => x.name === "Magnum");
    expect(magnum?.value).toBe(20000);
    expect(magnum?.count).toBe(2);
  });
  it("byAccount разделяет доход/расход по банку", () => {
    const acc = byAccount(applyFilters(data, {}));
    const halyk = acc.find((a) => a.name === "Halyk");
    expect(halyk?.income).toBe(450000);
    expect(halyk?.expense).toBe(15000);
  });
  it("accountOptions и dateRange", () => {
    expect(accountOptions(data)).toContain("Halyk");
    expect(dateRange(applyFilters(data, {}))).toEqual({ min: "2025-02-01", max: "2025-03-02" });
  });
});
