"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency as fmt } from "@/lib/currency";

interface CurrencyContextValue {
  currency: string;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  formatCurrency: (amount) => fmt(amount, "USD"),
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetch("/api/profile").then((r) => r.json()),
  });

  const currency: string = data?.data?.currency ?? "USD";

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        formatCurrency: (amount) => fmt(amount, currency),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
