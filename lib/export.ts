import * as XLSX from "xlsx";
import type { Transaction } from "@/lib/types";
import { getCategory } from "@/lib/categorize/categories";
import {
  computeKpis,
  expensesByCategory,
  byMonth,
  type Filters,
  applyFilters,
} from "@/lib/analytics";

/** Экспорт текущего среза в Excel: сводка, категории, помесячно, все транзакции. */
export function exportToExcel(
  all: Transaction[],
  filters: Filters,
  catLabel: (id: string) => string = (id) => getCategory(id).label,
): void {
  const txs = applyFilters(all, filters);
  const kpis = computeKpis(txs);
  const wb = XLSX.utils.book_new();

  const summary = [
    ["Показатель", "Значение (₸)"],
    ["Доходы", kpis.income.toFixed(2)],
    ["Расходы", kpis.expense.toFixed(2)],
    ["Нетто", kpis.net.toFixed(2)],
    ["Норма сбережений", `${(kpis.savingsRate * 100).toFixed(1)}%`],
    ["Транзакций", kpis.count],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Сводка");

  const cats = [
    ["Категория", "Сумма (₸)"],
    ...expensesByCategory(txs).map((c) => [catLabel(c.id), c.value.toFixed(2)]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cats), "Категории");

  const months = [
    ["Месяц", "Доход", "Расход", "Нетто"],
    ...byMonth(txs).map((m) => [m.month, m.income.toFixed(2), m.expense.toFixed(2), m.net.toFixed(2)]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(months), "Помесячно");

  const rows = [
    ["Дата", "Описание", "Категория", "Сумма", "Валюта", "Банк/Файл", "Счёт"],
    ...txs
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((t) => [
        t.date,
        t.description,
        catLabel(t.category || "other"),
        t.amount.toFixed(2),
        t.currency,
        t.bank || t.sourceFile,
        t.account || "",
      ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 12 }, { wch: 34 }, { wch: 20 }, { wch: 14 }, { wch: 8 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, "Транзакции");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `budget-control-${date}.xlsx`);
}
