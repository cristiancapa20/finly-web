"use client";

import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sileo";
import { useIsPWA } from "@/hooks/useIsPWA";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { CurrencyProvider } from "@/context/CurrencyContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuto
      retry: 1,
    },
  },
});

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const isPWA = useIsPWA();
  const toastPosition = isPWA ? "top-center" : isMobile ? "bottom-center" : "top-right";

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <CurrencyProvider>
          <Toaster position={toastPosition} theme="dark" />
          {children}
        </CurrencyProvider>
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
