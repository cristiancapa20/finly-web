/**
 * @module currency
 * Definiciones de monedas soportadas y utilidad de formateo.
 * La app soporta monedas de Latinoamérica, EE.UU., Europa y Reino Unido.
 */

/** Opción de moneda con su código ISO 4217, etiqueta para UI y locale para formateo. */
export interface CurrencyOption {
  /** Código ISO 4217 (ej: `"USD"`, `"CRC"`). */
  code: string;
  /** Etiqueta legible para mostrar en selectores de UI. */
  label: string;
  /** Locale de Intl para formateo correcto de la moneda. */
  locale: string;
}

/** Lista de monedas soportadas por la aplicación. */
export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", label: "USD — Dólar americano", locale: "en-US" },
  { code: "EUR", label: "EUR — Euro", locale: "de-DE" },
  { code: "MXN", label: "MXN — Peso mexicano", locale: "es-MX" },
  { code: "COP", label: "COP — Peso colombiano", locale: "es-CO" },
  { code: "CRC", label: "CRC — Colón costarricense", locale: "es-CR" },
  { code: "ARS", label: "ARS — Peso argentino", locale: "es-AR" },
  { code: "CLP", label: "CLP — Peso chileno", locale: "es-CL" },
  { code: "PEN", label: "PEN — Sol peruano", locale: "es-PE" },
  { code: "BRL", label: "BRL — Real brasileño", locale: "pt-BR" },
  { code: "GBP", label: "GBP — Libra esterlina", locale: "en-GB" },
];

/**
 * Formatea un monto numérico como string de moneda localizado.
 *
 * @param amount - Monto decimal a formatear.
 * @param currency - Código ISO 4217 de la moneda (ej: `"USD"`, `"CRC"`).
 * @returns String formateado según el locale de la moneda (ej: `"$12.50"`, `"₡1,250.00"`).
 *
 * @example
 * formatCurrency(12.5, "USD") // → "$12.50"
 * formatCurrency(1250, "CRC") // → "₡1,250.00"
 */
export function formatCurrency(amount: number, currency: string): string {
  const option = CURRENCIES.find((c) => c.code === currency);
  const locale = option?.locale ?? "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
