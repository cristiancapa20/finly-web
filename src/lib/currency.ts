export interface CurrencyOption {
  code: string;
  label: string;
  locale: string;
}

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
