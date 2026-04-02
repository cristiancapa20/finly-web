/**
 * @module ContentWrapper
 * Contenedor que ajusta espacios según el modo de visualización (PWA vs web).
 */

"use client";

import { useIsPWA } from "@/hooks/useIsPWA";

/**
 * Componente envolvedor que aplica estilos de espaciado dinámicos
 * según si la aplicación se ejecuta en modo PWA o web.
 * En PWA: añade espacio inferior para la barra de navegación.
 * En web: añade espacio superior para la barra de herramientas.
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Contenido a envolver
 * @returns {React.ReactElement} El contenedor con espaciado aplicado
 */
export default function ContentWrapper({ children }: { children: React.ReactNode }) {
  const isPWA = useIsPWA();

  return (
    <div
      className={`md:ml-64 flex flex-col min-h-screen transition-all ${
        isPWA
          ? "pt-0 pb-16 md:pt-0 md:pb-0"  // PWA móvil: sin top, espacio bottom nav
          : "pt-14 md:pt-0"               // Web móvil: espacio para el top bar
      }`}
    >
      {children}
    </div>
  );
}
