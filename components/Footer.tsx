"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="surface mt-auto border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted md:px-8">
        <div>© {new Date().getFullYear()} {t("brand")}</div>
        <div>
          {t("footer.localNote")}{" "}
          <Link href="/instructions" className="text-primary hover:underline">
            {t("footer.instructions")}
          </Link>{" "}
          {t("footer.and")}{" "}
          <Link href="/terms" className="text-primary hover:underline">
            {t("footer.terms")}
          </Link>
          .
        </div>
        <a
          href="https://github.com/savisafe/budget-control"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
