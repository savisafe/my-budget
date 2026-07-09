"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { BrandMark } from "@/components/BrandMark";

interface Props {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPT = ".csv,.tsv,.txt,.xlsx,.xls,.pdf";

export function FileDropzone({ onFiles, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { t } = useI18n();

  function handle(list: FileList | null) {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files);
      }}
      className={
        "group cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all md:p-14 " +
        (dragging
          ? "scale-[1.01] border-primary bg-primary/5"
          : "border-[color:var(--border)] bg-[color:var(--surface)]/40 hover:border-primary hover:bg-primary/5") +
        (disabled ? " pointer-events-none opacity-50" : "")
      }
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center transition-transform group-hover:scale-105">
        <BrandMark className="h-16 w-16" />
      </div>
      <div className="text-lg font-semibold">{t("dropzone.title")}</div>
      <div className="mt-1 text-sm text-muted">{t("dropzone.hint")}</div>
      <span className="btn btn-primary mt-5">{t("dropzone.button")}</span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
