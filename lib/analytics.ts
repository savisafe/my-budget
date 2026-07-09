import type { Transaction } from "@/lib/types";
import { getCategory } from "@/lib/categorize/categories";
import { monthKey } from "@/lib/format";

export interface Filters {
  from?: string; // ISO
  to?: string; // ISO
  account?: string; // bank/account
  category?: string;
}

export function applyFilters(txs: Transaction[], f: Filters): Transaction[] {
  return txs.filter((t) => {
    if (t.isTransfer) return false;
    if (f.from && t.date < f.from) return false;
    if (f.to && t.date > f.to) return false;
    if (f.account && (t.bank || t.sourceFile) !== f.account) return false;
    if (f.category && t.category !== f.category) return false;
    return true;
  });
}

export interface Kpis {
  income: number;
  expense: number; // положительное число (сумма трат)
  net: number;
  savingsRate: number; // 0..1
  count: number;
}

export function computeKpis(txs: Transaction[]): Kpis {
  const income = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = income - expense;
  const savingsRate = income > 0 ? net / income : 0;
  return { income, expense, net, savingsRate, count: txs.length };
}

export interface CategoryDatum {
  id: string;
  label: string;
  color: string;
  icon: string;
  value: number;
}

/** Расходы по категориям (по убыванию). */
export function expensesByCategory(txs: Transaction[]): CategoryDatum[] {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.amount >= 0) continue;
    const id = t.category || "other";
    map.set(id, (map.get(id) ?? 0) + Math.abs(t.amount));
  }
  return [...map.entries()]
    .map(([id, value]) => {
      const c = getCategory(id);
      return { id, label: c.label, color: c.color, icon: c.icon, value };
    })
    .sort((a, b) => b.value - a.value);
}

export interface MonthDatum {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  net: number;
}

export function byMonth(txs: Transaction[]): MonthDatum[] {
  const map = new Map<string, MonthDatum>();
  for (const t of txs) {
    const k = monthKey(t.date);
    if (!k) continue;
    const cur = map.get(k) ?? { month: k, income: 0, expense: 0, net: 0 };
    if (t.amount > 0) cur.income += t.amount;
    else cur.expense += Math.abs(t.amount);
    cur.net = cur.income - cur.expense;
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export interface MerchantDatum {
  name: string;
  value: number;
  count: number;
}

export function topMerchants(txs: Transaction[], limit = 10): MerchantDatum[] {
  const map = new Map<string, MerchantDatum>();
  for (const t of txs) {
    if (t.amount >= 0) continue;
    const name = t.description || "—";
    const cur = map.get(name) ?? { name, value: 0, count: 0 };
    cur.value += Math.abs(t.amount);
    cur.count += 1;
    map.set(name, cur);
  }
  return [...map.values()].sort((a, b) => b.value - a.value).slice(0, limit);
}

export interface AccountDatum {
  name: string;
  income: number;
  expense: number;
}

export function byAccount(txs: Transaction[]): AccountDatum[] {
  const map = new Map<string, AccountDatum>();
  for (const t of txs) {
    const name = t.bank || t.sourceFile || "—";
    const cur = map.get(name) ?? { name, income: 0, expense: 0 };
    if (t.amount > 0) cur.income += t.amount;
    else cur.expense += Math.abs(t.amount);
    map.set(name, cur);
  }
  return [...map.values()].sort((a, b) => b.expense - a.expense);
}

/** Список источников (банк/файл) для фильтра. */
export function accountOptions(txs: Transaction[]): string[] {
  return [...new Set(txs.map((t) => t.bank || t.sourceFile).filter(Boolean) as string[])].sort();
}

/** Диапазон дат данных. */
export function dateRange(txs: Transaction[]): { min: string; max: string } | null {
  if (txs.length === 0) return null;
  let min = txs[0].date;
  let max = txs[0].date;
  for (const t of txs) {
    if (t.date < min) min = t.date;
    if (t.date > max) max = t.date;
  }
  return { min, max };
}
