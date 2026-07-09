"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const LINKS = [
  { href: "/", key: "nav.import" },
  { href: "/review", key: "nav.review" },
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/instructions", key: "nav.instructions" },
  { href: "/assistant", key: "nav.assistant" },
];

export function Nav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  // Закрывать мобильное меню при смене маршрута.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const linkClass = (href: string) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
      (active ? "bg-primary text-white" : "text-muted hover:bg-black/5 dark:hover:bg-white/10")
    );
  };

  return (
    <header className="surface sticky top-0 z-40 border-b backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 md:px-8">
        <Link href="/" className="mr-auto flex items-center gap-2 font-bold">
          <span className="text-xl">💰</span>
          <span className="hidden sm:inline">{t("brand")}</span>
        </Link>

        {/* Десктоп: ссылки в ряд + переключатель языка */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {t(l.key)}
            </Link>
          ))}
          <LanguageSwitcher className="ml-2" />
        </div>

        {/* Мобилка: бургер */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={t("nav.menu")}
          aria-expanded={open}
          className="surface flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
        >
          <span className="relative block h-4 w-5">
            <span
              className={
                "absolute left-0 block h-0.5 w-5 bg-current transition-all " +
                (open ? "top-1.5 rotate-45" : "top-0")
              }
            />
            <span
              className={
                "absolute left-0 top-1.5 block h-0.5 w-5 bg-current transition-all " +
                (open ? "opacity-0" : "opacity-100")
              }
            />
            <span
              className={
                "absolute left-0 block h-0.5 w-5 bg-current transition-all " +
                (open ? "top-1.5 -rotate-45" : "top-3")
              }
            />
          </span>
        </button>
      </nav>

      {/* Мобильное выпадающее меню */}
      {open && (
        <div className="border-t md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {t(l.key)}
              </Link>
            ))}
            <div className="mt-2 border-t pt-3">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
