"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="surface flex gap-4 rounded-xl border p-5">
      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary font-bold text-white">
        {n}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <div className="text-sm text-muted">{children}</div>
      </div>
    </div>
  );
}

export default function InstructionsPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">{t("instr.title")}</h1>
        <p className="mt-1 text-muted">{t("instr.subtitle")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t("instr.stepsHeading")}</h2>
        <Step n={1} title={t("instr.step1.title")}>
          {t("instr.step1.body")}
        </Step>
        <Step n={2} title={t("instr.step2.title")}>
          {t("instr.step2.body")}
        </Step>
        <Step n={3} title={t("instr.step3.title")}>
          {t("instr.step3.body")}
        </Step>
        <Step n={4} title={t("instr.step4.title")}>
          {t("instr.step4.body")}
        </Step>
        <Step n={5} title={t("instr.step5.title")}>
          {t("instr.step5.body")}
        </Step>
        <Step n={6} title={t("instr.step6.title")}>
          {t("instr.step6.body")}
        </Step>
      </section>

      <section className="surface space-y-2 rounded-xl border p-5">
        <h2 className="text-xl font-semibold">{t("instr.privacy.title")}</h2>
        <p className="text-sm text-muted">{t("instr.privacy.body")}</p>
      </section>

      <section className="surface space-y-2 rounded-xl border p-5">
        <h2 className="text-xl font-semibold">{t("instr.pwa.title")}</h2>
        <p className="text-sm text-muted">{t("instr.pwa.body")}</p>
      </section>

      <section className="surface space-y-2 rounded-xl border p-5">
        <h2 className="text-xl font-semibold">{t("instr.assistant.title")}</h2>
        <p className="text-sm text-muted">
          {t("instr.assistant.body")}{" "}
          <Link href="/assistant" className="text-primary hover:underline">
            {t("nav.assistant")}
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
