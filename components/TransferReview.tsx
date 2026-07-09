"use client";

import { useBudget } from "@/lib/store";
import { formatMoney, formatDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";

export function TransferReview() {
  const { t } = useI18n();
  const { transactions, transferPairs, confirmTransfer, rejectTransfer } = useBudget();
  const byId = new Map(transactions.map((tx) => [tx.id, tx]));

  const candidates = transferPairs.filter((p) => p.status === "candidate");
  const confirmed = transferPairs.filter((p) => p.status === "confirmed");

  if (transferPairs.length === 0) {
    return <p className="text-muted">{t("transfers.none")}</p>;
  }

  const row = (out?: Transaction, inc?: Transaction) => (
    <div className="min-w-0 text-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="tnum text-danger">
          ↑ {out ? formatMoney(out.amount, out.currency) : "—"}
        </span>
        <span className="text-muted">·</span>
        <span className="tnum text-accent">
          ↓ {inc ? formatMoney(inc.amount, inc.currency) : "—"}
        </span>
      </div>
      <div className="text-muted">
        {out?.bank || out?.sourceFile} → {inc?.bank || inc?.sourceFile} ·{" "}
        {out ? formatDate(out.date) : ""}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {candidates.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold">{t("transfers.candidates", { n: candidates.length })}</h3>
          <div className="space-y-2">
            {candidates.map((p) => (
              <div
                key={p.id}
                className="surface flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                {row(byId.get(p.outId), byId.get(p.inId))}
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => confirmTransfer(p.id)}
                    className="btn btn-primary flex-1 sm:flex-none"
                  >
                    {t("transfers.isTransfer")}
                  </button>
                  <button
                    onClick={() => rejectTransfer(p.id)}
                    className="btn btn-secondary flex-1 sm:flex-none"
                  >
                    {t("transfers.notTransfer")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmed.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-muted">
            {t("transfers.confirmed", { n: confirmed.length })}
          </h3>
          <div className="space-y-2">
            {confirmed.map((p) => (
              <div
                key={p.id}
                className="surface flex flex-col gap-3 rounded-lg border border-dashed p-3 opacity-70 sm:flex-row sm:items-center sm:justify-between"
              >
                {row(byId.get(p.outId), byId.get(p.inId))}
                <button
                  onClick={() => rejectTransfer(p.id)}
                  className="btn btn-secondary shrink-0"
                >
                  {t("transfers.return")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
