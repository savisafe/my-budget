"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BrandMark } from "@/components/BrandMark";

// Основные пункты — в десктоп-панели; второстепенные прячутся в «Ещё».
const PRIMARY = [
  { href: "/", key: "nav.import" },
  { href: "/review", key: "nav.review" },
  { href: "/dashboard", key: "nav.dashboard" },
];
const SECONDARY = [
  { href: "/instructions", key: "nav.instructions" },
  { href: "/assistant", key: "nav.assistant" },
];
const ALL = [...PRIMARY, ...SECONDARY];

export function Nav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Закрывать меню при смене маршрута.
  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
    (isActive(href)
      ? "bg-primary/12 text-primary"
      : "text-muted hover:bg-black/5 dark:hover:bg-white/10");

  const secondaryActive = SECONDARY.some((l) => isActive(l.href));

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--surface)]/80 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 md:px-8">
        <Link href="/" className="mr-auto flex items-center gap-2.5 font-bold">
          <BrandMark className="h-8 w-8 shrink-0" />
          <span className="hidden text-lg brand-gradient sm:inline">{t("brand")}</span>
        </Link>

        {/* Десктоп: основные ссылки + «Ещё» + язык */}
        <div className="hidden items-center gap-1 md:flex">
          {PRIMARY.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {t(l.key)}
            </Link>
          ))}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className={
                "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                (secondaryActive
                  ? "bg-primary/12 text-primary"
                  : "text-muted hover:bg-black/5 dark:hover:bg-white/10")
              }
            >
              {t("nav.more")}
              <span
                className={"text-xs transition-transform " + (moreOpen ? "rotate-180" : "")}
                aria-hidden
              >
                ▾
              </span>
            </button>

            {moreOpen && (
              <>
                {/* клик вне меню закрывает его */}
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMoreOpen(false)}
                />
                <div
                  role="menu"
                  className="card absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden p-1 shadow-lg"
                >
                  {SECONDARY.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      role="menuitem"
                      className={
                        "block rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                        (isActive(l.href)
                          ? "bg-primary/12 text-primary"
                          : "hover:bg-black/5 dark:hover:bg-white/10")
                      }
                    >
                      {t(l.key)}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

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

      {/* Мобильное выпадающее меню — все пункты */}
      {open && (
        <div className="border-t md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3">
            {ALL.map((l) => (
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
