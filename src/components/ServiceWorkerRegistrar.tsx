/**
 * @module ServiceWorkerRegistrar
 * Registra el Service Worker para soporte offline en modo PWA.
 */

"use client";

import { useEffect } from "react";

/**
 * Componente que registra automáticamente el Service Worker en producción.
 * Habilita capacidades offline y actualizaciones en segundo plano.
 * Solo se ejecuta en el cliente y solo en producción.
 * @returns {null} El componente no renderiza nada visualmente
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    }
  }, []);

  return null;
}
