import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import RegisterSW from "./components/RegisterSW";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ConverGeo · Onde seu dinheiro compra melhor em Salvador",
  description:
    "Inteligência imobiliária: Opportunity Score, Match Score, mapa e marketplace para o seu orçamento em Salvador.",
  applicationName: "ConverGeo",
  authors: [{ name: "ConverGeo" }],
  keywords: [
    "imóveis",
    "Salvador",
    "oportunidade",
    "marketplace",
    "ConverGeo",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ConverGeo",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#006aff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1220" },
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overscroll-none">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
