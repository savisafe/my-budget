"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileDropzone } from "@/components/FileDropzone";
import { ColumnMapper } from "@/components/ColumnMapper";
import { parseFile } from "@/lib/parsers";
import { guessMapping, normalizeRows } from "@/lib/normalize";
import { useBudget } from "@/lib/store";
import type { ColumnMapping, ParsedFile } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";

interface Pending {
  file: ParsedFile;
  mapping: ColumnMapping;
}

export default function ImportPage() {
  const { t } = useI18n();
  const { transactions, transferPairs, mappings, addTransactions, saveMapping, clearAll } =
    useBudget();
  const [pending, setPending] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const candidateCount = transferPairs.filter((p) => p.status === "candidate").length;

  async function onFiles(files: File[]) {
    setBusy(true);
    setError(null);
    let added = 0;
    const nextPending: Pending[] = [];

    for (const file of files) {
      try {
        const parsed = await parseFile(file);

        // Формат уже нормализован (напр. Kaspi PDF) — импортируем сразу.
        if (parsed.preNormalized && parsed.preNormalized.length > 0) {
          added += await addTransactions(parsed.preNormalized);
          continue;
        }

        if (parsed.rows.length === 0) {
          setError(t("import.errorUnrecognized", { name: file.name }));
          continue;
        }

        // Пытаемся подобрать сохранённый пресет по совпадению заголовков.
        const preset = matchPreset(parsed, mappings);
        nextPending.push({
          file: parsed,
          mapping: preset ?? guessMapping(parsed.headers),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : t("import.errorUnrecognized", { name: file.name }));
      }
    }

    setPending((prev) => [...prev, ...nextPending]);
    setBusy(false);
    if (added > 0) showToast(t("import.imported", { n: added }));
  }

  async function confirmMapping(index: number, mapping: ColumnMapping) {
    const item = pending[index];
    const txs = normalizeRows(item.file, mapping);
    const added = await addTransactions(txs);
    if (mapping.name.trim()) await saveMapping(mapping);
    setPending((prev) => prev.filter((_, i) => i !== index));
    showToast(t("import.imported", { n: added }));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">{t("import.title")}</h1>
        <p className="mt-1 text-muted">{t("import.subtitle")}</p>
      </div>

      <FileDropzone onFiles={onFiles} disabled={busy} />

      {busy && (
        <div className="flex items-center gap-3 text-muted">
          <span className="inline-block h-5 w-5 animate-spin-slow rounded-full border-2 border-[color:var(--border)] border-t-primary" />
          {t("import.processing")}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t("import.setupColumns")}</h2>
          {pending.map((p, i) => (
            <ColumnMapper
              key={`${p.file.fileName}-${i}`}
              file={p.file}
              initial={p.mapping}
              onConfirm={(m) => confirmMapping(i, m)}
              onCancel={() => setPending((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}

      {/* Сводка */}
      {transactions.length > 0 && (
        <div className="surface rounded-xl border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <div className="text-sm text-muted">{t("import.loaded")}</div>
            </div>
            <SummaryTotals />
            <div className="flex gap-2">
              {candidateCount > 0 && (
                <Link
                  href="/review"
                  className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-2 text-sm font-medium hover:bg-warning/20"
                >
                  {t("import.checkTransfers", { n: candidateCount })}
                </Link>
              )}
              <Link
                href="/dashboard"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                {t("import.openDashboard")}
              </Link>
              <button
                onClick={() => {
                  if (confirm(t("import.clearConfirm"))) clearAll();
                }}
                className="rounded-lg border border-danger/40 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"
              >
                {t("import.clear")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white shadow-lg">
          ✅ {toast}
        </div>
      )}
    </div>
  );
}

function SummaryTotals() {
  const { t } = useI18n();
  const all = useBudget((s) => s.transactions);
  const transactions = useMemo(() => all.filter((tx) => !tx.isTransfer), [all]);
  const income = transactions.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const expense = transactions.filter((tx) => tx.amount < 0).reduce((s, tx) => s + tx.amount, 0);
  return (
    <div className="flex gap-6">
      <div>
        <div className="text-lg font-bold text-accent">{formatMoney(income)}</div>
        <div className="text-xs text-muted">{t("import.income")}</div>
      </div>
      <div>
        <div className="text-lg font-bold text-danger">{formatMoney(expense)}</div>
        <div className="text-xs text-muted">{t("import.expense")}</div>
      </div>
    </div>
  );
}

/** Ищет сохранённый пресет, все ключевые колонки которого есть в заголовках файла. */
function matchPreset(file: ParsedFile, mappings: ColumnMapping[]): ColumnMapping | undefined {
  const headerSet = new Set(file.headers.map((h) => h.toLowerCase().trim()));
  return mappings.find((m) => {
    const need = [m.date, m.description, m.amount, m.debit, m.credit].filter(Boolean) as string[];
    return need.length > 0 && need.every((c) => headerSet.has(c.toLowerCase().trim()));
  });
}
