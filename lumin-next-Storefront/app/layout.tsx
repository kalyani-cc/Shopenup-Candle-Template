import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { QuickAddHandlers } from "@/components/ui/quick-add-handlers";
import { ToastHost } from "@/components/ui/toast-host";
import "./globals.css";
import { SHOPENUP_BACKEND_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Lumin — Candles",
  description: "Handcrafted candles and home fragrance — shop the Lumin candle collection."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body
        data-backend-url={SHOPENUP_BACKEND_URL}
        data-publishable-key={process.env.NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY || ""}
      >
        <Suspense
          fallback={
            <header
              className="header bg-white lumin-site-navbar-single-row"
              aria-hidden="true"
              style={{ minHeight: "4.5rem" }}
            />
          }
        >
          <SiteNavbar />
        </Suspense>
        <main className="lumin-page-content">{children}</main>
        <SiteFooter />
        <QuickAddHandlers />
        <ToastHost />
        <Script src="/assets/js/lumin-count-sync.js?v=lumin2026counts" strategy="lazyOnload" />
      </body>
    </html>
  );
}
