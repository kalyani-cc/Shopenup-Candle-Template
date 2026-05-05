import type { Metadata } from "next";
import Script from "next/script";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { QuickAddHandlers } from "@/components/ui/quick-add-handlers";
import { ToastHost } from "@/components/ui/toast-host";
import "./globals.css";

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
        data-backend-url={process.env.NEXT_PUBLIC_SHOPENUP_BACKEND_URL || "http://localhost:9000"}
        data-publishable-key={process.env.NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY || ""}
      >
        <SiteNavbar />
        <main className="lumin-page-content">{children}</main>
        <SiteFooter />
        <QuickAddHandlers />
        <ToastHost />
        <Script src="/assets/js/lumin-count-sync.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
