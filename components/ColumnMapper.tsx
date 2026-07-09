"use client";

import { useMemo, useState } from "react";
import type { ColumnMapping, ParsedFile } from "@/lib/types";
import { normalizeRows } from "@/lib/normalize";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";

interface Props {
  file: ParsedFile;
  initial: ColumnMapping;
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

/** UI сопоставления колонок CSV/Excel с предпросмотром результата. */
export function ColumnMapper({ file, initial, onConfirm, onCancel }: Props) {
  const { t } = useI18n();
  const [m, setM] = useState<ColumnMapping>(initial);
  const options = file.headers;

  const preview = useMemo(() => {
    try {
      return normalizeRows(file, m).slice(0, 5);
    } catch {
      return [];
    }
  }, [file, m]);

  function set<K extends keyof ColumnMapping>(key: K, value: ColumnMapping[K]) {
    setM((prev) => ({ ...prev, [key]: value }));
  }

  const Select = ({
    label,
    field,
    allowEmpty,
  }: {
    label: string;
    field: keyof ColumnMapping;
    allowEmpty?: boolean;
  }) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <select
        className="surface rounded-lg border px-2 py-1.5"
        value={(m[field] as string) ?? ""}
        onChange={(e) => set(field, (e.target.value || undefined) as never)}
      >
        {allowEmpty && <option value="">{t("mapper.dash")}</option>}
        {options.map((h, i) => (
          <option key={`${h}-${i}`} value={h}>
            {h || t("mapper.colN", { n: i + 1 })}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="surface rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-semibold">📑 {file.fileName}</div>
        <span className="text-xs text-muted">{t("mapper.rows", { n: file.rows.length })}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t("mapper.bankName")}</span>
          <input
            className="surface rounded-lg border px-2 py-1.5"
            value={m.name}
            placeholder={t("mapper.bankPlaceholder")}
            onChange={(e) => set("name", e.target.value)}
          />
        </label>

        <Select label={t("mapper.date")} field="date" />
        <Select label={t("mapper.description")} field="description" />

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t("mapper.amountFormat")}</span>
          <select
            className="surface rounded-lg border px-2 py-1.5"
            value={m.amountMode}
            onChange={(e) => set("amountMode", e.target.value as ColumnMapping["amountMode"])}
          >
            <option value="single">{t("mapper.single")}</option>
            <option value="debitCredit">{t("mapper.debitCredit")}</option>
          </select>
        </label>

        {m.amountMode === "single" ? (
          <Select label={t("mapper.amount")} field="amount" />
        ) : (
          <>
            <Select label={t("mapper.debit")} field="debit" allowEmpty />
            <Select label={t("mapper.credit")} field="credit" allowEmpty />
          </>
        )}

        <Select label={t("mapper.account")} field="account" allowEmpty />

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t("mapper.decimalSep")}</span>
          <select
            className="surface rounded-lg border px-2 py-1.5"
            value={m.decimalSeparator ?? "auto"}
            onChange={(e) => set("decimalSeparator", e.target.value as "," | "." | "auto")}
          >
            <option value="auto">{t("mapper.auto")}</option>
            <option value=",">{t("mapper.comma")}</option>
            <option value=".">{t("mapper.dot")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t("mapper.currency")}</span>
          <input
            className="surface rounded-lg border px-2 py-1.5"
            value={m.currency ?? "KZT"}
            onChange={(e) => set("currency", e.target.value.toUpperCase())}
          />
        </label>

        <label className="mt-6 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(m.invertSign)}
            onChange={(e) => set("invertSign", e.target.checked)}
          />
          {t("mapper.invertSign")}
        </label>
      </div>

      {/* Предпросмотр */}
      <div className="mt-4">
        <div className="mb-1 text-xs font-medium text-muted">{t("mapper.previewTitle")}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-1 pr-3">{t("mapper.date")}</th>
                <th className="py-1 pr-3">{t("mapper.description")}</th>
                <th className="py-1 text-right">{t("mapper.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {preview.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-2 text-muted">
                    {t("mapper.previewEmpty")}
                  </td>
                </tr>
              )}
              {preview.map((tx) => (
                <tr key={tx.id} className="border-t border-[color:var(--border)]">
                  <td className="py-1 pr-3 whitespace-nowrap">{tx.date}</td>
                  <td className="py-1 pr-3">{tx.description}</td>
                  <td
                    className={
                      "py-1 text-right whitespace-nowrap " +
                      (tx.amount >= 0 ? "text-accent" : "text-danger")
                    }
                  >
                    {formatMoney(tx.amount, tx.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onConfirm(m)}
          disabled={preview.length === 0}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {t("mapper.import")}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          {t("mapper.skip")}
        </button>
      </div>
    </div>
  );
}
