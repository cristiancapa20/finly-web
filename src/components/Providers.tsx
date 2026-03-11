"use client";

import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sileo";
import { useIsPWA } from "@/hooks/useIsPWA";

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
  const toastPosition = isPWA ? "top-center" : isMobile ? "bottom-right" : "top-right";

  return (
    <SessionProvider>
      <Toaster position={toastPosition} theme="dark" />
      {children}
    </SessionProvider>
  );
}
