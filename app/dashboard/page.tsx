"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBudget } from "@/lib/store";
import {
  applyFilters,
  computeKpis,
  expensesByCategory,
  byMonth,
  topMerchants,
  byAccount,
  accountOptions,
  dateRange,
  type Filters,
} from "@/lib/analytics";
import { KpiCards } from "@/components/dashboard/KpiCards";
import {
  CategoryDonut,
  TrendChart,
  TopMerchants,
  AccountBars,
} from "@/components/dashboard/Charts";
import { CATEGORIES } from "@/lib/categorize/categories";
import { exportToExcel } from "@/lib/export";
import { useI18n } from "@/lib/i18n/context";

export default function DashboardPage() {
  const { t } = useI18n();
  const { transactions } = useBudget();
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => setMounted(true), []);

  const analytical = useMemo(() => transactions.filter((t) => !t.isTransfer), [transactions]);
  const range = useMemo(() => dateRange(analytical), [analytical]);
  const accounts = useMemo(() => accountOptions(analytical), [analytical]);

  const filtered = useMemo(() => applyFilters(transactions, filters), [transactions, filters]);
  const kpis = useMemo(() => computeKpis(filtered), [filtered]);
  const cats = useMemo(() => expensesByCategory(filtered), [filtered]);
  const months = useMemo(() => byMonth(filtered), [filtered]);
  const merchants = useMemo(() => topMerchants(filtered), [filtered]);
  const accountData = useMemo(() => byAccount(filtered), [filtered]);

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t("dash.title")}</h1>
        <p className="text-muted">
          {t("review.noData")}{" "}
          <Link href="/" className="text-primary hover:underline">
            {t("review.loadStatements")}
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{t("dash.title")}</h1>
          <p className="mt-1 text-muted">{t("dash.subtitle")}</p>
        </div>
        <button
          onClick={() => exportToExcel(transactions, filters, (id) => t(`cat.${id}`))}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t("dash.export")}
        </button>
      </div>

      {/* Фильтры */}
      <div className="surface grid grid-cols-2 gap-3 rounded-xl border p-4 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t("dash.from")}</span>
          <input
            type="date"
            className="surface rounded-lg border px-2 py-1.5"
            min={range?.min}
            max={range?.max}
            value={filters.from ?? ""}
            onChange={(e) => set("from", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t("dash.to")}</span>
          <input
            type="date"
            className="surface rounded-lg border px-2 py-1.5"
            min={range?.min}
            max={range?.max}
            value={filters.to ?? ""}
            onChange={(e) => set("to", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t("dash.accountBank")}</span>
          <select
            className="surface rounded-lg border px-2 py-1.5"
            value={filters.account ?? ""}
            onChange={(e) => set("account", e.target.value)}
          >
            <option value="">{t("dash.all")}</option>
            {accounts.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t("dash.category")}</span>
          <select
            className="surface rounded-lg border px-2 py-1.5"
            value={filters.category ?? ""}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">{t("dash.all")}</option>
            {CATEGORIES.filter((c) => c.id !== "transfer").map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {t(`cat.${c.id}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <KpiCards kpis={kpis} />

      {mounted ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <TrendChart data={months} />
          <CategoryDonut data={cats} />
          <TopMerchants data={merchants} />
          <AccountBars data={accountData} />
        </div>
      ) : (
        <div className="text-muted">{t("dash.loadingCharts")}</div>
      )}
    </div>
  );
}
