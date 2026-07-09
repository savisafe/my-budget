"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import {
  type CategoryDatum,
  type MonthDatum,
  type MerchantDatum,
  type AccountDatum,
} from "@/lib/analytics";
import { formatMoney, formatCompact, formatMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text)",
  fontSize: 13,
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export function CategoryDonut({ data }: { data: CategoryDatum[] }) {
  const { t } = useI18n();
  if (data.length === 0)
    return <Card title={t("chart.catExpenses")}>{t("chart.noExpenses")}</Card>;
  const view = data.map((d) => ({ ...d, label: t(`cat.${d.id}`) }));
  return (
    <Card title={t("chart.catExpenses")}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={view}
              dataKey="value"
              nameKey="label"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
            >
              {view.map((d) => (
                <Cell key={d.id} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, n) => [formatMoney(v), n]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {view.slice(0, 6).map((d) => (
          <li key={d.id} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: d.color }} />
              {d.icon} {d.label}
            </span>
            <span className="font-medium">{formatMoney(d.value)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function TrendChart({ data }: { data: MonthDatum[] }) {
  const { t } = useI18n();
  if (data.length === 0) return <Card title={t("chart.trend")}>{t("chart.noData")}</Card>;
  const view = data.map((d) => ({ ...d, label: formatMonth(d.month) }));
  return (
    <Card title={t("chart.trend")}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={view}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted)" }} />
            <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12, fill: "var(--muted)" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
            <Legend />
            <Bar dataKey="income" name={t("chart.income")} fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name={t("chart.expense")} fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Line dataKey="net" name={t("chart.net")} stroke="#0284c7" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function TopMerchants({ data }: { data: MerchantDatum[] }) {
  const { t } = useI18n();
  if (data.length === 0) return <Card title={t("chart.topMerchants")}>{t("chart.noExpenses")}</Card>;
  return (
    <Card title={t("chart.topMerchants")}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tickFormatter={formatCompact} tick={{ fontSize: 12, fill: "var(--muted)" }} />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 11, fill: "var(--muted)" }}
            />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
            <Bar dataKey="value" name={t("chart.spend")} fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function AccountBars({ data }: { data: AccountDatum[] }) {
  const { t } = useI18n();
  if (data.length === 0) return <Card title={t("chart.byAccounts")}>{t("chart.noData")}</Card>;
  return (
    <Card title={t("chart.byAccounts")}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} />
            <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12, fill: "var(--muted)" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
            <Legend />
            <Bar dataKey="income" name={t("chart.income")} fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name={t("chart.expense")} fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
