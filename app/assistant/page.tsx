"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";

const FEATURE_KEYS = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;
const FEATURE_ICONS = ["🏷️", "💡", "🎯", "💬", "🔔", "🔒"];

export default function AssistantPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function notify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      localStorage.setItem("assistant-waitlist-email", email.trim());
    } catch {
      /* ignore */
    }
    setSent(true);
  }

  return (
    <div className="space-y-10">
      <section className="text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          {t("assistant.soon")}
        </div>
        <h1 className="text-3xl font-bold md:text-5xl">{t("assistant.title")}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted">{t("assistant.subtitle")}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURE_KEYS.map((k, i) => (
          <div key={k} className="surface rounded-2xl border p-5">
            <div className="text-3xl">{FEATURE_ICONS[i]}</div>
            <h3 className="mt-2 font-semibold">{t(`assistant.${k}.title`)}</h3>
            <p className="mt-1 text-sm text-muted">{t(`assistant.${k}.body`)}</p>
          </div>
        ))}
      </section>

      <section className="surface mx-auto max-w-xl rounded-2xl border p-6 text-center">
        <h2 className="text-xl font-semibold">{t("assistant.waitlist.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("assistant.waitlist.body")}</p>
        {sent ? (
          <div className="mt-4 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
            {t("assistant.waitlist.sent")}
          </div>
        ) : (
          <form onSubmit={notify} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("assistant.waitlist.placeholder")}
              className="surface flex-grow rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              {t("assistant.waitlist.button")}
            </button>
          </form>
        )}
        <p className="mt-2 text-xs text-muted">{t("assistant.waitlist.note")}</p>
      </section>
    </div>
  );
}
