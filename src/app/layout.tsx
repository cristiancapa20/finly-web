import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
            <div className={`${session ? "md:ml-64 pt-14 md:pt-0" : ""} flex flex-col min-h-screen`}>
              <main className="flex-1">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  {children}
                </div>
              </main>
              <Footer />
            </div>
            {session && <QuickTransactionButton />}
          </Providers>
        </body>
      </html>
    </ViewTransitions>
  );
}
