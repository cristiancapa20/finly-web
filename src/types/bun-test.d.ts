/**
 * @module bun-test.d.ts
 * Tipos de definición para el framework de testing de Bun.
 */

/**
 * Tipos de definición para las APIs de testing de Bun.
 * Proporciona tipos para describe, test y expect.
 * @global
 */
declare module "bun:test" {
  /**
   * Define un bloque de pruebas (suite)
   * @param {string} name - Nombre descriptivo del suite
   * @param {() => void} fn - Función que contiene los tests
   */
  export const describe: (name: string, fn: () => void) => void;

  /**
   * Define una prueba individual
   * @param {string} name - Nombre descriptivo de la prueba
   * @param {() => void} fn - Función que ejecuta la prueba
   */
  export const test: (name: string, fn: () => void) => void;

  /**
   * Función para crear aserciones en pruebas
   * @param {unknown} value - Valor a verificar
   * @returns {Object} Objeto con métodos de aserción
   * @returns {(expected: unknown) => void} toBe - Verifica igualdad estricta
   * @returns {() => void} toBeNull - Verifica que el valor sea null
   */
  export const expect: (value: unknown) => {
    /** Verifica igualdad estricta (===) */
    toBe: (expected: unknown) => void;
    /** Verifica que el valor sea null */
    toBeNull: () => void;
  };
}
