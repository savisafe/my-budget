"use client";

import { useI18n } from "@/lib/i18n/context";

export default function TermsPage() {
  const { t } = useI18n();
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{t("terms.title")}</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t("terms.license.title")}</h2>
        <p className="text-muted">{t("terms.license.body")}</p>
        <ul className="list-inside list-disc text-muted">
          <li>{t("terms.license.allowed")}</li>
          <li>{t("terms.license.forbidden")}</li>
          <li>{t("terms.license.attribution")}</li>
        </ul>
        <p className="text-xs text-muted">Copyright © 2025 savisafe.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t("terms.data.title")}</h2>
        <p className="text-muted">{t("terms.data.body1")}</p>
        <p className="text-muted">{t("terms.data.body2")}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t("terms.disclaimer.title")}</h2>
        <p className="text-muted">{t("terms.disclaimer.body")}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t("terms.acceptance.title")}</h2>
        <p className="text-muted">{t("terms.acceptance.body")}</p>
      </section>
    </article>
  );
}
