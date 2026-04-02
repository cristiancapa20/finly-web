/**
 * @module toast
 * Wrapper de notificaciones toast usando la librería Sileo.
 * Aplica estilos oscuros consistentes a todas las notificaciones de la app.
 */

import { sileo } from "sileo";

/** Estilos base dark theme para todos los toasts. */
const baseStyles = {
  fill: "#171717",
  styles: {
    title: "!text-white",
    description: "!text-white/80",
  },
};

/**
 * API de notificaciones toast con estilos pre-configurados.
 *
 * @example
 * toast.success({ title: "Transacción creada" });
 * toast.error({ title: "Error", description: "No se pudo guardar" });
 */
export const toast = {
  /** Muestra una notificación de éxito. */
  success: (opts: { title: string; description?: string }) =>
    sileo.success({ ...baseStyles, ...opts }),
  /** Muestra una notificación de error. */
  error: (opts: { title: string; description?: string }) =>
    sileo.error({ ...baseStyles, ...opts }),
};
