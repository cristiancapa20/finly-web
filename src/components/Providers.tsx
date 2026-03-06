"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sileo";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster position="top-center" />
      {children}
    </SessionProvider>
  );
}
