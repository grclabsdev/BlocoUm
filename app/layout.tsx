import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://blocoum.vercel.app"),
  title: {
    default: "BlocoUm",
    template: "%s · BlocoUm",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  description: "Gestão financeira e operacional do seu condomínio",
  manifest: "/manifest.webmanifest", // gerado automaticamente pelo manifest.ts
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BlocoUm",
  },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // evita zoom acidental em formulários mobile
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang='en'
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        interHeading.variable,
      )}
    >
      <body className='min-h-full flex flex-col'>{children}</body>
    </html>
  );
}
