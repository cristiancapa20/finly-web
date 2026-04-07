import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";
import Providers from "@/components/Providers";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import AppChrome from "@/components/AppChrome";
import { ViewTransitions } from "next-view-transitions";
import JsonLd, { organizationSchema } from "@/components/JsonLd";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://finlycr.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "FinlyCR — Control de Finanzas Personales",
    template: "%s | FinlyCR",
  },
  description:
    "Controla tus finanzas personales: registra gastos e ingresos, gestiona cuentas bancarias, y lleva seguimiento de préstamos y suscripciones. Gratis y fácil de usar.",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  keywords: [
    "finanzas personales",
    "control de gastos",
    "presupuesto",
    "Costa Rica",
    "app financiera",
    "gastos e ingresos",
    "cuentas bancarias",
    "préstamos",
    "suscripciones",
  ],
  authors: [{ name: "FinlyCR" }],
  creator: "FinlyCR",
  openGraph: {
    type: "website",
    locale: "es_CR",
    url: BASE_URL,
    siteName: "FinlyCR",
    title: "FinlyCR — Control de Finanzas Personales",
    description:
      "Registra gastos, gestiona cuentas y controla préstamos y suscripciones. Todo en un solo lugar, gratis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FinlyCR — Control de Finanzas Personales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinlyCR — Control de Finanzas Personales",
    description:
      "Registra gastos, gestiona cuentas y controla préstamos y suscripciones. Todo en un solo lugar, gratis.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinlyCR",
  },
  icons: {
    icon: [
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/icon-512.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="es">
        <body className={`${inter.className} bg-gray-50 min-h-screen`}>
          <JsonLd data={organizationSchema} />
          <Providers>
            <ServiceWorkerRegistrar />
            <AppChrome>{children}</AppChrome>
          </Providers>
        </body>
      </html>
    </ViewTransitions>
  );
}
