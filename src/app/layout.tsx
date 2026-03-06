import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import QuickTransactionButton from "@/components/QuickTransactionButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ViewTransitions } from "next-view-transitions";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Personal finance tracker with AI-powered transaction parsing",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <ViewTransitions>
      <html lang="es">
        <body className={`${inter.className} bg-gray-50 min-h-screen`}>
          <Providers>
            {session && <Header />}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            {session && <QuickTransactionButton />}
          </Providers>
        </body>
      </html>
    </ViewTransitions>
  );
}
