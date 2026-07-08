"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBudget } from "@/lib/store";
import { TransferReview } from "@/components/TransferReview";
import { CategorySelect } from "@/components/CategorySelect";
import { formatMoney, formatDate } from "@/lib/format";
import { getCategory } from "@/lib/categorize/categories";
import { useI18n } from "@/lib/i18n/context";

export default function ReviewPage() {
  const { t } = useI18n();
  const { transactions, setCategory } = useBudget();
  const [query, setQuery] = useState("");
  const [onlyUncat, setOnlyUncat] = useState(false);

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    return transactions
      .filter((tx) => !tx.isTransfer)
      .filter((tx) => (onlyUncat ? !tx.category || tx.category === "other" : true))
      .filter((tx) => (q ? tx.description.toLowerCase().includes(q) : true))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 300);
  }, [transactions, query, onlyUncat]);

  const uncategorized = transactions.filter(
    (tx) => !tx.isTransfer && (!tx.category || tx.category === "other"),
  ).length;

  const labelSource = (s: string) => (s === "rule" ? t("review.sourceRule") : t("review.sourceManual"));

  if (transactions.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t("review.title")}</h1>
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">{t("review.title")}</h1>
        <p className="mt-1 text-muted">{t("review.subtitle")}</p>
      </div>

      <section className="surface rounded-xl border p-5">
        <h2 className="mb-3 text-xl font-semibold">{t("review.transfersHeading")}</h2>
        <TransferReview />
      </section>

      <section className="surface rounded-xl border p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t("review.categoriesHeading")}</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">{t("review.uncategorized", { n: uncategorized })}</span>
            <span
              title={t("review.aiSoonTitle")}
              className="cursor-default rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
            >
              {t("review.aiSoon")}
            </span>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("review.search")}
            className="surface flex-grow rounded-lg border px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyUncat}
              onChange={(e) => setOnlyUncat(e.target.checked)}
            />
            {t("review.onlyUncat")}
          </label>
        </div>

        <div className="divide-y divide-[color:var(--border)]">
          {visible.map((tx) => {
            const cat = getCategory(tx.category);
            return (
              <div key={tx.id} className="flex flex-wrap items-center gap-3 py-2">
                <div className="min-w-0 flex-grow">
                  <div className="truncate font-medium">
                    {cat.icon} {tx.description}
                  </div>
                  <div className="text-xs text-muted">
                    {formatDate(tx.date)} · {tx.bank || tx.sourceFile}
                    {tx.categorySource && ` · ${labelSource(tx.categorySource)}`}
                  </div>
                </div>
                <div
                  className={
                    "w-28 text-right text-sm font-semibold " +
                    (tx.amount >= 0 ? "text-accent" : "text-danger")
                  }
                >
                  {formatMoney(tx.amount, tx.currency)}
                </div>
                <CategorySelect
                  value={tx.category}
                  onChange={(c) => setCategory(tx.id, c, "manual")}
                  compact
                />
              </div>
            );
          })}
        </div>
        {visible.length === 0 && <p className="text-muted">{t("review.notFound")}</p>}
      </section>
    </div>
  );
}
