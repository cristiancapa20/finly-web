/**
 * @module CurrencyContext
 * Contexto global para gestionar la moneda del usuario y formato de números.
 */

"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency as fmt } from "@/lib/currency";

/**
 * Valor del contexto de moneda
 * @typedef {Object} CurrencyContextValue
 * @property {string} currency - Código ISO de la moneda (ej: USD, EUR, COP)
 * @property {(amount: number) => string} formatCurrency - Función para formatear montos
 */
export interface CurrencyContextValue {
  /** Código ISO de la moneda actual */
  currency: string;
  /** Función para formatear un monto numérico en la moneda del usuario */
  formatCurrency: (amount: number) => string;
}

/**
 * Contexto creado para acceso global a la moneda
 * @type {React.Context<CurrencyContextValue>}
 */
const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  formatCurrency: (amount) => fmt(amount, "USD"),
});

/**
 * Proveedor del contexto de moneda.
 * Obtiene la moneda preferida del usuario desde el perfil.
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Contenido a envolver
 * @returns {React.ReactElement} Proveedor configurado
 */
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

/**
 * Hook para acceder al contexto de moneda desde cualquier componente.
 * @returns {CurrencyContextValue} Objeto con moneda actual y función de formateo
 * @example
 * const { currency, formatCurrency } = useCurrency();
 * console.log(formatCurrency(100)); // "$100.00" o similar según moneda
 */
export function useCurrency() {
  return useContext(CurrencyContext);
}
