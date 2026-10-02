import type { Metadata, Viewport } from "next";
import { MotionConfig } from "motion/react";
import { CatalogProvider } from "@/lib/catalog";
import { gambetta, satoshi } from "./fonts/fonts";
import "./globals.css";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { CartDrawer } from "@/components/commerce/cart-drawer";
import { CommandPalette } from "@/components/site/command-palette";
import { Toaster } from "@/components/site/toaster";

export const metadata: Metadata = {
  // Placeholder: replace with the real origin before launch, or canonical URLs
  // and social cards will point at localhost.
  metadataBase: new URL("https://wowspice.example"),
  title: {
    default: "wowspice — whole spices from Kerala, dried the slow way",
    template: "%s · wowspice",
  },
  description:
    "Eleven whole spices from smallholdings across Kerala, dried on mats rather than in kilns, and dispatched from Kochi within two working days.",
  openGraph: {
    type: "website",
    siteName: "wowspice",
    title: "wowspice — whole spices from Kerala",
    description:
      "Whole spices bought direct from Kerala smallholdings. Sun-dried, hand-graded, dispatched from Kochi.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0908",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${gambetta.variable} ${satoshi.variable}`}>
      <body>
        {/* `reducedMotion="user"` auto-disables transform animations for
            prefers-reduced-motion users while keeping opacity/colour. */}
        <MotionConfig reducedMotion="user">
          <CatalogProvider>
            <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:rounded-full focus:bg-[var(--ws-paper)] focus:px-4 focus:py-2 focus:text-[#100d0c]"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <CartDrawer />
          <CommandPalette />
            <Toaster />
          </CatalogProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
