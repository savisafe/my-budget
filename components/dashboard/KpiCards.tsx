"use client";

import type { Kpis } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";

export function KpiCards({ kpis }: { kpis: Kpis }) {
  const { t } = useI18n();
  const items = [
    { label: t("kpi.income"), value: formatMoney(kpis.income), cls: "text-accent" },
    { label: t("kpi.expense"), value: formatMoney(kpis.expense), cls: "text-danger" },
    {
      label: t("kpi.net"),
      value: formatMoney(kpis.net),
      cls: kpis.net >= 0 ? "text-accent" : "text-danger",
    },
    {
      label: t("kpi.savingsRate"),
      value: `${(kpis.savingsRate * 100).toFixed(1)}%`,
      cls: kpis.savingsRate >= 0 ? "text-primary" : "text-danger",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="surface rounded-xl border p-4">
          <div className="text-sm text-muted">{it.label}</div>
          <div className={"mt-1 text-xl font-bold md:text-2xl " + it.cls}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}
