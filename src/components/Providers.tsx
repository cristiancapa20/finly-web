"use client";

import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sileo";

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
  return (
    <SessionProvider>
      <Toaster position={isMobile ? "top-center" : "top-right"} theme="dark" />
      {children}
    </SessionProvider>
  );
}
