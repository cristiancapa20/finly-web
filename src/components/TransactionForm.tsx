"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useCurrency } from "@/context/CurrencyContext";

interface Category {
  id: string;
  name: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface FormState {
  amount: string;
  type: "INCOME" | "EXPENSE" | "";
  categoryId: string;
  accountId: string;
  description: string;
  date: string;
}

const getToday = () => new Date().toISOString().split("T")[0];

const defaultForm = (): FormState => ({
  amount: "",
  type: "",
  categoryId: "",
  accountId: "",
  description: "",
  date: getToday(),
});

export default function TransactionForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === form.accountId);
  const insufficientFunds =
    form.type === "EXPENSE" &&
    !!form.amount &&
    !!selectedAccount &&
    parseFloat(form.amount) > selectedAccount.balance;

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ]).then(([catRes, accRes]) => {
      if (catRes.data) setCategories(catRes.data);
      if (accRes.data) setAccounts(accRes.data);
      setAccountsLoaded(true);
    });
  }, []);

  async function handleSave() {
    if (insufficientFunds) {
      toast.error({ title: "Saldo insuficiente", description: `Tu saldo en ${selectedAccount?.name} es insuficiente para este gasto.` });
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          type: form.type,
          categoryId: form.categoryId,
          accountId: form.accountId,
          description: form.description || null,
          date: form.date,
        }),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) {
        toast.error({ title: "Error al guardar la transacción", description: data.error });
        return;
      }

      toast.success({ title: "Transacción guardada exitosamente" });
      setForm(defaultForm());
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onSuccess?.();
    } catch {
      toast.error({ title: "Error de red al guardar la transacción" });
    } finally {
      setIsSaving(false);
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const inputBase =
    "w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 transition-colors border-gray-300 bg-white focus:border-indigo-500 focus:ring-indigo-200";

  return (
    <div className="space-y-6">
      {/* No accounts warning banner */}
      {accountsLoaded && accounts.length === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-amber-800">
            No tienes ninguna cuenta creada. Para registrar transacciones primero debes{" "}
            <Link href="/settings" className="font-semibold underline hover:text-amber-900">
              crear una cuenta en Configuración
            </Link>
            .
          </p>
        </div>
      )}

      {/* Manual form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Nueva transacción
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Monto
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              className={inputBase}
              placeholder="0.00"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              className={inputBase}
            >
              <option value="">Seleccionar...</option>
              <option value="INCOME">Ingreso</option>
              <option value="EXPENSE">Gasto</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className={inputBase}
            >
              <option value="">Seleccionar...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Cuenta
            </label>
            {accounts.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span>
                  Sin cuentas.{" "}
                  <Link href="/settings" className="font-semibold underline hover:text-amber-900">
                    Crear en Configuración →
                  </Link>
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <select
                  value={form.accountId}
                  onChange={(e) => updateField("accountId", e.target.value)}
                  className={`${inputBase} ${insufficientFunds ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}`}
                >
                  <option value="">Seleccionar...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {formatCurrency(a.balance)}
                    </option>
                  ))}
                </select>
                {insufficientFunds && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    Saldo insuficiente. Disponible: {formatCurrency(selectedAccount?.balance ?? 0)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className={inputBase}
              placeholder="Descripción de la transacción"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              className={inputBase}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={
              isSaving ||
              !form.amount ||
              !form.type ||
              !form.categoryId ||
              !form.accountId ||
              !form.date ||
              insufficientFunds
            }
            className="w-full sm:w-auto px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Guardando...
              </>
            ) : (
              "Guardar transacción"
            )}
          </button>
          <button
            onClick={() => setForm(defaultForm())}
            className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
