"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sileo";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster position="top-center" theme="dark" duration={1500} />
      {children}
    </SessionProvider>
  );
}
