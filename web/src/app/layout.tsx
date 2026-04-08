import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteUrl } from "@/lib/env";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  description: siteConfig.description,
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteConfig.name} | Portfolio & Games`,
    template: `%s | ${siteConfig.name}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#20315f_0%,#10192d_38%,#090d17_100%)] text-slate-100">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(249,185,120,0.22),transparent_52%)]" />
          <SiteHeader />
          <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-10 sm:px-6 sm:py-14">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
