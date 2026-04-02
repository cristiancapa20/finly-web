/**
 * @module money
 * Utilidades para conversión entre montos decimales y centavos (enteros).
 * La app almacena todos los montos en centavos para evitar errores de punto flotante.
 */

/**
 * Convierte un monto ingresado por el usuario (decimal) a centavos (entero).
 *
 * @param amount - Monto como número o string (ej: `"12.50"` o `12.5`).
 * @returns El monto en centavos redondeado al entero más cercano, o `NaN` si el input es inválido.
 *
 * @example
 * amountInputToCents("12.50") // → 1250
 * amountInputToCents(9.99)    // → 999
 * amountInputToCents("abc")   // → NaN
 */
export function amountInputToCents(amount: number | string) {
  const parsed = typeof amount === "number" ? amount : Number.parseFloat(amount);

  if (Number.isNaN(parsed)) {
    return Number.NaN;
  }

  return Math.round(parsed * 100);
}

/**
 * Convierte un monto en centavos a su representación decimal.
 *
 * @param cents - Monto en centavos (entero).
 * @returns El monto como número decimal.
 *
 * @example
 * centsToAmount(1250) // → 12.5
 * centsToAmount(999)  // → 9.99
 */
export function centsToAmount(cents: number) {
  return cents / 100;
}
