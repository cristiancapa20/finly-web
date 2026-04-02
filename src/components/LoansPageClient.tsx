/**
 * @module LoansPageClient
 * Página que agrupa préstamos/deudas y suscripciones con selector de sección.
 */

"use client";

import { useState } from "react";
import { HandCoins, Repeat } from "lucide-react";
import LoansClient from "./LoansClient";
import SubscriptionsClient from "./SubscriptionsClient";

/**
 * Tipo para las secciones disponibles
 * @typedef {"loans" | "subscriptions"} Section
 */
type Section = "loans" | "subscriptions";

/**
 * Componente que gestiona dos secciones: Préstamos y Suscripciones.
 * Proporciona un selector de pestañas para navegar entre ambas.
 * @returns {React.ReactElement} La página con selector de secciones
 */
export default function LoansPageClient() {
  const [section, setSection] = useState<Section>("loans");

  return (
    <div>
      {/* Top-level section toggle */}
      <div className="flex bg-gray-900 rounded-xl p-1.5 gap-1 mb-6">
        {(
          [
            ["loans", "Préstamos", "y Deudas", HandCoins],
            ["subscriptions", "Suscripciones", "", Repeat],
          ] as const
        ).map(([val, label, sublabel, Icon]) => (
          <button
            key={val}
            type="button"
            onClick={() => setSection(val)}
            className={`flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2.5 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-colors min-w-0 ${
              section === val
                ? "bg-indigo-600 text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {label}
              {sublabel && <span className="hidden sm:inline"> {sublabel}</span>}
            </span>
          </button>
        ))}
      </div>

      {section === "loans" ? <LoansClient /> : <SubscriptionsClient />}
    </div>
  );
}
