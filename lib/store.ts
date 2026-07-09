"use client";

import { create } from "zustand";
import type { Transaction, TransferPair, ColumnMapping, CategorySource } from "@/lib/types";
import { db, type TransferDecision } from "@/lib/db";
import { categorizeByRules } from "@/lib/categorize/rules";
import { detectTransfers } from "@/lib/transfers";

function normKey(desc: string): string {
  return desc.toLowerCase().replace(/\s+/g, " ").trim();
}

interface BudgetState {
  transactions: Transaction[];
  transferPairs: TransferPair[];
  mappings: ColumnMapping[];
  loaded: boolean;

  load: () => Promise<void>;
  addTransactions: (txs: Transaction[]) => Promise<number>;
  setCategory: (id: string, category: string, source?: CategorySource) => Promise<void>;
  applyRules: () => Promise<void>;
  refreshTransfers: () => Promise<void>;
  confirmTransfer: (pairId: string) => Promise<void>;
  rejectTransfer: (pairId: string) => Promise<void>;
  saveMapping: (m: ColumnMapping) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useBudget = create<BudgetState>((set, get) => ({
  transactions: [],
  transferPairs: [],
  mappings: [],
  loaded: false,

  async load() {
    if (!db) return;
    const [transactions, transferPairs, mappings] = await Promise.all([
      db.transactions.toArray(),
      db.transferPairs.toArray(),
      db.mappings.toArray(),
    ]);
    set({ transactions, transferPairs, mappings, loaded: true });
  },

  async addTransactions(txs) {
    if (!db) return 0;
    // Дедуп по id (одинаковые транзакции из повторно загруженного файла).
    const existing = new Set(get().transactions.map((t) => t.id));
    const fresh = txs.filter((t) => !existing.has(t.id));
    if (fresh.length === 0) return 0;

    await db.transactions.bulkPut(fresh);
    set({ transactions: [...get().transactions, ...fresh] });
    await get().applyRules();
    await get().refreshTransfers();
    return fresh.length;
  },

  async setCategory(id, category, source = "manual") {
    if (!db) return;
    const txs = get().transactions.map((t) =>
      t.id === id ? { ...t, category, categorySource: source } : t,
    );
    const tx = txs.find((t) => t.id === id);
    if (tx) {
      await db.transactions.put(tx);
      // Ручной выбор запоминаем, чтобы применять к похожим описаниям при переимпорте.
      if (source === "manual") {
        await db.overrides.put({ key: normKey(tx.description), category });
      }
    }
    set({ transactions: txs });
  },

  async applyRules() {
    if (!db) return;
    const overrides = await db.overrides.toArray();
    const overrideMap = new Map(overrides.map((c) => [c.key, c.category]));

    const txs = get().transactions.map((t) => {
      if (t.categorySource === "manual") return t; // ручное не трогаем
      const override = overrideMap.get(normKey(t.description));
      if (override) return { ...t, category: override, categorySource: "manual" as const };
      const ruled = categorizeByRules(t);
      if (ruled) return { ...t, category: ruled, categorySource: "rule" as const };
      return t;
    });

    await db.transactions.bulkPut(txs);
    set({ transactions: txs });
  },

  async refreshTransfers() {
    if (!db) return;
    const decisions = await db.transferDecisions.toArray();
    const decisionMap = new Map(decisions.map((d) => [d.id, d.status]));

    const detected = detectTransfers(get().transactions);
    const pairs: TransferPair[] = detected.map((p) => ({
      ...p,
      status: decisionMap.get(p.id) ?? "candidate",
    }));

    // Отметить транзакции, входящие в подтверждённые переводы.
    const confirmedIds = new Set<string>();
    for (const p of pairs) {
      if (p.status === "confirmed") {
        confirmedIds.add(p.outId);
        confirmedIds.add(p.inId);
      }
    }
    const txs = get().transactions.map((t) => ({
      ...t,
      isTransfer: confirmedIds.has(t.id),
      transferPairId: pairs.find((p) => p.outId === t.id || p.inId === t.id)?.id,
    }));

    await db.transferPairs.clear();
    await db.transferPairs.bulkPut(pairs);
    await db.transactions.bulkPut(txs);
    set({ transferPairs: pairs, transactions: txs });
  },

  async confirmTransfer(pairId) {
    await setDecision(pairId, "confirmed");
    await get().refreshTransfers();
  },

  async rejectTransfer(pairId) {
    await setDecision(pairId, "rejected");
    await get().refreshTransfers();
  },

  async saveMapping(m) {
    if (!db) return;
    await db.mappings.put(m);
    const others = get().mappings.filter((x) => x.name !== m.name);
    set({ mappings: [...others, m] });
  },

  async clearAll() {
    if (!db) return;
    await Promise.all([
      db.transactions.clear(),
      db.transferPairs.clear(),
      db.transferDecisions.clear(),
    ]);
    set({ transactions: [], transferPairs: [] });
  },
}));

async function setDecision(id: string, status: TransferDecision["status"]) {
  if (!db) return;
  await db.transferDecisions.put({ id, status });
}
