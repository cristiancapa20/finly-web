/**
 * @module OnboardingModal
 * Modal de bienvenida para configuración inicial: moneda y primera cuenta.
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { TrendingUp } from "lucide-react";
import { toast } from "@/lib/toast";
import { CURRENCIES } from "@/lib/currency";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Tipo de cuenta bancaria
 * @typedef {"CASH" | "BANK" | "CREDIT_CARD" | "OTHER"} AccountType
 */
type AccountType = "CASH" | "BANK" | "CREDIT_CARD" | "OTHER";

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Efectivo",
  BANK: "Ahorro",
  CREDIT_CARD: "Crédito",
  OTHER: "Corriente",
};

const CARD_COLORS = [
  "#1e3a5f", "#0f766e", "#7c3aed", "#be185d", "#b45309",
  "#1d4ed8", "#065f46", "#831843", "#1e40af", "#374151",
];

/**
 * Modal de bienvenida con 3 pasos:
 * 1. Seleccionar moneda principal
 * 2. Crear primera cuenta
 * 3. Establecer saldo inicial
 * Se muestra automáticamente al primer login sin cuentas registradas.
 * @returns {React.ReactElement|null} El modal o null si ya tiene cuentas
 */
export default function OnboardingModal() {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [savingCurrency, setSavingCurrency] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [color, setColor] = useState("#1e3a5f");
  const [balance, setBalance] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.data) && data.data.length === 0) {
          setShow(true);
        }
      })
      .catch(() => {});
  }, [status]);

  async function handleSaveCurrencyAndContinue() {
    setSavingCurrency(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: selectedCurrency }),
      });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    } finally {
      setSavingCurrency(false);
    }
    setStep(1);
  }

  async function handleCreate() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          color,
          initialBalance: parseFloat(balance) || 0,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Error al crear la cuenta");
        return;
      }

      toast.success({ title: "¡Cuenta creada! Ya puedes registrar tus movimientos." });
      setShow(false);
    } finally {
      setSaving(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">¡Bienvenido a FinlyCR!</h2>
          <p className="text-sm text-gray-500 mt-1">
            {step === 0
              ? "Primero, ¿en qué moneda manejas tus finanzas?"
              : "Ahora registra tu primera cuenta bancaria o de efectivo."}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[
            { n: 0, label: "Moneda" },
            { n: 1, label: "Cuenta" },
            { n: 2, label: "Saldo" },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center">
              {i > 0 && <div className="w-6 h-px bg-gray-300 mx-1" />}
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === n ? "bg-indigo-600 text-white" : step > n ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}>
                  {n + 1}
                </div>
                <span className={`text-xs font-medium ${step === n ? "text-indigo-600" : "text-gray-400"}`}>{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Step 0 — Currency */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Moneda principal</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                autoFocus
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Puedes cambiarla más adelante en tu perfil.</p>
            </div>
            <button
              type="button"
              disabled={savingCurrency}
              onClick={handleSaveCurrencyAndContinue}
              className="w-full bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {savingCurrency ? "Guardando..." : "Continuar →"}
            </button>
          </div>
        )}

        {/* Step 1 — Account info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Nombre o apodo <span className="text-gray-400">(para identificarla)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Ej: Pichincha, Efectivo, Mi tarjeta..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo de cuenta</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-2">Color de la tarjeta</label>
              <div className="flex flex-wrap gap-2">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? "border-gray-800 scale-110" : "border-transparent hover:scale-105"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => setStep(2)}
              className="w-full bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* Step 2 — Balance */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Preview card */}
            <div
              className="relative rounded-xl overflow-hidden h-20 px-4 py-3 flex flex-col justify-between"
              style={{ background: `linear-gradient(135deg, ${color}ee, ${color}99)` }}
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/20" />
              <p className="text-white/70 text-xs uppercase tracking-wide relative z-10">
                {ACCOUNT_TYPE_LABELS[type]}
              </p>
              <p className="text-white font-semibold text-sm relative z-10 truncate">{name}</p>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Saldo inicial <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                autoFocus
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="0.00"
              />
              <p className="text-[11px] text-gray-400 mt-1">Puedes poner 0 si no tienes saldo aún.</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Atrás
              </button>
              <button
                type="button"
                disabled={saving || balance === ""}
                onClick={handleCreate}
                className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Creando..." : "Crear cuenta"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShow(false)}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors pt-1"
            >
              Omitir por ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
