/**
 * @module useIsPWA
 * Hook para detectar si la aplicación se ejecuta en modo PWA.
 */

"use client";

import { useEffect, useState } from "react";

/**
 * Verifica si la aplicación se ejecuta en modo PWA.
 * Detecta el modo de visualización del navegador.
 * @returns {boolean} True si está en modo PWA, false en caso contrario
 * @private
 */
function checkIsPWA(): boolean {
  const nav = window.navigator as unknown as { standalone?: boolean };

  if (nav.standalone === true) return true;

  const modes = ["standalone", "fullscreen", "minimal-ui"];
  if (modes.some((m) => window.matchMedia(`(display-mode: ${m})`).matches)) return true;

  return false;
}

/**
 * Hook que detecta si la aplicación se ejecuta en modo PWA.
 * Útil para adaptar la interfaz a modo "aplicación instalada" vs navegador.
 * @returns {boolean} True si está en modo PWA, false en caso contrario
 * @example
 * const isPWA = useIsPWA();
 * if (isPWA) {
 *   // Mostrar interfaz optimizada para PWA
 * }
 */
export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setIsPWA(checkIsPWA());

    const mq = window.matchMedia("(display-mode: standalone)");
    const handler = () => setIsPWA(checkIsPWA());
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isPWA;
}
