import { describe, it, expect } from "vitest";
import { categorizeByRules } from "@/lib/categorize/rules";

describe("categorizeByRules", () => {
  const cases: [string, number, string][] = [
    ["Magnum супермаркет", -15000, "groceries"],
    ["Yandex Taxi", -2300, "transport"],
    ["KFC Достык", -4500, "cafe"],
    ["Netflix.com", -4990, "subscriptions"],
    ["Аптека Европа", -3200, "health"],
    ["Wildberries", -25400, "shopping"],
    ["АЗС Helios", -12000, "fuel"],
    ["Beeline пополнение", -3000, "utilities"],
    ["Зарплата ТОО", 450000, "salary"],
  ];

  it.each(cases)("%s -> %s", (desc, amount, expected) => {
    expect(categorizeByRules({ description: desc, amount })).toBe(expected);
  });

  it("незнакомый расход -> undefined", () => {
    expect(categorizeByRules({ description: "QWE-XYZ-123", amount: -100 })).toBeUndefined();
  });

  it("незнакомый доход -> income_other", () => {
    expect(categorizeByRules({ description: "Возврат XYZ", amount: 5000 })).toBe("income_other");
  });

  it("регистронезависимо", () => {
    expect(categorizeByRules({ description: "MAGNUM", amount: -1 })).toBe("groceries");
  });
});
