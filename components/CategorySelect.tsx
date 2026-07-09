"use client";

import { CATEGORIES, getCategory } from "@/lib/categorize/categories";
import { useI18n } from "@/lib/i18n/context";

interface Props {
  value: string | undefined;
  onChange: (categoryId: string) => void;
  compact?: boolean;
}

export function CategorySelect({ value, onChange, compact }: Props) {
  const { t } = useI18n();
  const cat = getCategory(value);
  return (
    <select
      value={value ?? "other"}
      onChange={(e) => onChange(e.target.value)}
      title={t(`cat.${cat.id}`)}
      className={
        "surface rounded-lg border px-2 py-1 text-sm " + (compact ? "max-w-[190px]" : "w-full")
      }
    >
      {CATEGORIES.filter((c) => c.id !== "transfer").map((c) => (
        <option key={c.id} value={c.id}>
          {c.icon} {t(`cat.${c.id}`)}
        </option>
      ))}
    </select>
  );
}
