import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
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
  metadataBase: new URL("https://radar-global-two.vercel.app"),
  title: "Radar Global",
  description: "Radar de lançamentos globais",
  manifest: "/manifest.json",
  applicationName: "Radar Global",
  appleWebApp: {
    capable: true,
    title: "Radar Global",
    statusBarStyle: "black-translucent",
  },
  icons: [
    { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    { url: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png" },
    { url: "/icons/icon-192.png", rel: "apple-touch-icon", sizes: "192x192" },
  ],
  openGraph: {
    title: "Radar Global",
    description: "Radar de lançamentos globais",
    siteName: "Radar Global",
    images: [
      {
        url: "/brand/banner-laptop.png",
        width: 1920,
        height: 1080,
        alt: "Radar Global",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Radar Global",
    description: "Radar de lançamentos globais",
    images: ["/brand/banner-laptop.png"],
  },
};

export const viewport = {
  themeColor: "#0B1C33",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
