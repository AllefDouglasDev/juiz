import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { AppHeader } from "@/components/layout/app-header";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SwRegister } from "@/components/pwa/sw-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Racha dos Primos",
    template: "%s — Racha dos Primos",
  },
  description:
    "Gerencie jogadores, sorteie times equilibrados e controle a partida com timer, cartões e apito.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Racha dos Primos",
  },
};

export const viewport: Viewport = {
  // cover + safe-area insets: content flows under the iPhone notch/Dynamic
  // Island without being hidden by it.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <AppHeader />
          <main className="flex flex-1 flex-col px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {children}
          </main>
          <InstallPrompt />
          <SwRegister />
        </AppProviders>
      </body>
    </html>
  );
}
