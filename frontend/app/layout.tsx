import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { ReactNode } from "react";
import { Providers } from "@/app/providers";
import { AppShell } from "@/components/layout/AppShell";
import { OfflineQueueMount } from "@/components/OfflineQueueMount";
import { LifeOsRealtimeProvider } from "@/services/realtime";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Dream Life",
  description: "A calm place to take small daily steps toward the life you want."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-lifeos-page text-lifeos-fg`}>
        <Script id="lifeos-locale-init" strategy="beforeInteractive">
          {`(function(){
  try {
    var k = "lifeos-locale";
    var loc = localStorage.getItem(k);
    if (loc === "en" || loc === "ru" || loc === "fi") document.documentElement.lang = loc;
  } catch (e) {}
})();`}
        </Script>
        <Script id="lifeos-theme-init" strategy="beforeInteractive">
          {`(function(){
  try {
    var k = "lifeos-theme";
    var raw = localStorage.getItem(k);
    var pref = (raw === "dark" || raw === "light" || raw === "system") ? raw : "system";
    var resolved = pref === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : pref;
    var root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    root.style.colorScheme = resolved;
  } catch (e) {}
})();`}
        </Script>
        <Providers>
          <LifeOsRealtimeProvider>
            <OfflineQueueMount />
            <AppShell>{children}</AppShell>
          </LifeOsRealtimeProvider>
        </Providers>
      </body>
    </html>
  );
}
