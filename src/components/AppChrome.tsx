"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuickTransactionButton from "@/components/QuickTransactionButton";
import BottomNav from "@/components/BottomNav";
import ContentWrapper from "@/components/ContentWrapper";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (status === "loading") {
    return <main className="flex-1">{children}</main>;
  }

  if (!session || isPublicRoute) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <ContentWrapper>
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
        <Footer />
      </ContentWrapper>
      <QuickTransactionButton />
      <BottomNav />
    </>
  );
}

