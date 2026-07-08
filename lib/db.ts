import Dexie, { type Table } from "dexie";
import type { Transaction, TransferPair, ColumnMapping } from "@/lib/types";

/** Ручное переопределение категории: нормализованное описание -> id категории. */
export interface OverrideEntry {
  key: string;
  category: string;
}

/** Решение по переводу, чтобы помнить между сессиями (по сигнатуре пары). */
export interface TransferDecision {
  id: string; // transferPairId
  status: "confirmed" | "rejected";
}

class BudgetDB extends Dexie {
  transactions!: Table<Transaction, string>;
  transferPairs!: Table<TransferPair, string>;
  mappings!: Table<ColumnMapping, string>;
  overrides!: Table<OverrideEntry, string>;
  transferDecisions!: Table<TransferDecision, string>;

  constructor() {
    super("budget-control");
    // v1 — историческая схема (таблица aiCache).
    this.version(1).stores({
      transactions: "id, date, sourceFile, bank, category, isTransfer",
      transferPairs: "id, status, outId, inId",
      mappings: "name",
      aiCache: "key",
      transferDecisions: "id",
    });
    // v2 — aiCache переименована в overrides (ручные переопределения категорий).
    this.version(2)
      .stores({
        transactions: "id, date, sourceFile, bank, category, isTransfer",
        transferPairs: "id, status, outId, inId",
        mappings: "name",
        aiCache: null,
        overrides: "key",
        transferDecisions: "id",
      })
      .upgrade(async (tx) => {
        // Переносим сохранённые переопределения из старой таблицы, если были.
        try {
          const old = await tx.table("aiCache").toArray();
          if (old.length) await tx.table("overrides").bulkPut(old);
        } catch {
          /* старой таблицы могло не быть */
        }
      });
  }
}

/** Единственный экземпляр БД (только на клиенте). */
export const db = typeof window !== "undefined" ? new BudgetDB() : (null as unknown as BudgetDB);
