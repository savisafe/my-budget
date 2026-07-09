import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { StoreHydrator } from "@/components/StoreHydrator";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { I18nProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "My budget — анализ выписок",
  description:
    "Импорт выписок из разных банков, автоматическое исключение переводов между своими счетами, категоризация трат и подробный дашборд.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My budget",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <I18nProvider>
          <StoreHydrator />
          <ServiceWorkerRegister />
          <Nav />
          <main className="mx-auto w-full max-w-6xl flex-grow px-4 py-6 md:px-8 md:py-10">
            {children}
          </main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
