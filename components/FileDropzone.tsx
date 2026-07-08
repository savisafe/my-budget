"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

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
        "cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all md:p-16 " +
        (dragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-[color:var(--border)] hover:border-primary hover:bg-primary/5") +
        (disabled ? " pointer-events-none opacity-50" : "")
      }
    >
      <div className="mb-3 text-5xl">📄</div>
      <div className="text-lg font-semibold">{t("dropzone.title")}</div>
      <div className="mt-1 text-sm text-muted">{t("dropzone.hint")}</div>
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
