"use client";

import type { Kpis } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";

export function KpiCards({ kpis }: { kpis: Kpis }) {
  const { t } = useI18n();
  const items = [
    {
      label: t("kpi.income"),
      value: formatMoney(kpis.income),
      cls: "text-accent",
      icon: "↓",
      tint: "bg-accent/12 text-accent",
    },
    {
      label: t("kpi.expense"),
      value: formatMoney(kpis.expense),
      cls: "text-danger",
      icon: "↑",
      tint: "bg-danger/12 text-danger",
    },
    {
      label: t("kpi.net"),
      value: formatMoney(kpis.net),
      cls: kpis.net >= 0 ? "text-accent" : "text-danger",
      icon: "∑",
      tint: "bg-primary/12 text-primary",
    },
    {
      label: t("kpi.savingsRate"),
      value: `${(kpis.savingsRate * 100).toFixed(1)}%`,
      cls: kpis.savingsRate >= 0 ? "text-primary" : "text-danger",
      icon: "%",
      tint: "bg-gold/15 text-[color:var(--color-gold)]",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="card card-hover p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted">{it.label}</div>
            <span
              className={
                "flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold " + it.tint
              }
            >
              {it.icon}
            </span>
          </div>
          <div className={"tnum mt-2 text-xl font-bold md:text-2xl " + it.cls}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}
