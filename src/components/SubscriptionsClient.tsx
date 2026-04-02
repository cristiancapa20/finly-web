/**
 * @module SubscriptionsClient
 * Gestor de suscripciones recurrentes mensuales.
 */

"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "@/context/CurrencyContext";
import Skeleton from "react-loading-skeleton";
import { toast } from "@/lib/toast";
import { Plus, X, Trash2, Pencil, Repeat, Pause, Play, Clock } from "lucide-react";

/**
 * Representa una categoría dentro de suscripciones
 * @typedef {Object} SubCategory
 * @property {string} id - ID único de la categoría
 * @property {string} name - Nombre de la categoría
 * @property {string} color - Color hexadecimal de la categoría
 */
interface SubCategory {
  id: string;
  name: string;
  color: string;
}

interface SubAccount {
  id: string;
  name: string;
  balance?: number;
}

interface Subscription {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  isActive: boolean;
  categoryId: string | null;
  accountId: string;
  category: SubCategory | null;
  account: SubAccount;
  createdAt: string;
}

const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-200 transition-colors";

function dayLabel(day: number) {
  return `Día ${day} de cada mes`;
}

/* ─── New / Edit Modal ─── */
function SubscriptionModal({
  onClose,
  onSaved,
  editing,
}: {
  onClose: () => void;
  onSaved: (sub: Subscription) => void;
  editing?: Subscription | null;
}) {
  const { formatCurrency } = useCurrency();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    amount: editing?.amount?.toString() ?? "",
    dayOfMonth: editing?.dayOfMonth?.toString() ?? "1",
    categoryId: editing?.categoryId ?? "",
    accountId: editing?.accountId ?? "",
  });
  const [categories, setCategories] = useState<SubCategory[]>([]);
  const [accounts, setAccounts] = useState<SubAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ])
      .then(([catRes, accRes]) => {
        if (catRes.data) setCategories(catRes.data);
        if (accRes.data) setAccounts(accRes.data);
      })
      .finally(() => setLoaded(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.amount || !form.accountId) return;
    setLoading(true);
    try {
      const url = editing
        ? `/api/subscriptions/${editing.id}`
        : "/api/subscriptions";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          amount: parseFloat(form.amount),
          dayOfMonth: parseInt(form.dayOfMonth),
          categoryId: form.categoryId || null,
          accountId: form.accountId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error({ title: "Error", description: data.error });
        return;
      }
      toast.success({
        title: editing ? "Suscripción actualizada" : "Suscripción creada",
      });
      onSaved(data.data);
      onClose();
    } catch {
      toast.error({ title: "Error de red" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {editing ? "Editar suscripción" : "Nueva suscripción"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Cobro recurrente mensual
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nombre del servicio
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className={inputCls}
                placeholder="Ej: Spotify, Netflix, Gimnasio"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Monto mensual
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                className={inputCls}
                placeholder="0.00"
                required
              />
            </div>

            {/* Day of month */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Día de cobro
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.dayOfMonth}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dayOfMonth: e.target.value }))
                }
                className={inputCls}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Se cobra el día {form.dayOfMonth || "?"} de cada mes
              </p>
            </div>

            {/* Account */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cuenta de cobro
              </label>
              <select
                value={form.accountId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accountId: e.target.value }))
                }
                className={inputCls}
                required
                disabled={!loaded || accounts.length === 0}
              >
                <option value="">
                  {loaded ? "Selecciona una cuenta" : "Cargando cuentas..."}
                </option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {a.balance !== undefined
                      ? ` — ${formatCurrency(a.balance)}`
                      : ""}
                  </option>
                ))}
              </select>
              {loaded && accounts.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Debes crear una cuenta primero.
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Categoría{" "}
                <span className="text-gray-400">(opcional)</span>
              </label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                className={inputCls}
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={
                  loading ||
                  !form.name.trim() ||
                  !form.amount ||
                  !form.accountId ||
                  accounts.length === 0
                }
                className="flex-1 py-2.5 text-white text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading
                  ? "Guardando..."
                  : editing
                    ? "Guardar cambios"
                    : "Crear suscripción"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Subscription Card ─── */
function SubscriptionCard({
  sub,
  onToggle,
  onEdit,
  onDelete,
}: {
  sub: Subscription;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { formatCurrency } = useCurrency();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    try {
      const res = await fetch(`/api/subscriptions/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !sub.isActive }),
      });
      if (!res.ok) {
        toast.error({ title: "Error al cambiar estado" });
        return;
      }
      onToggle();
    } catch {
      toast.error({ title: "Error de red" });
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/subscriptions/${sub.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error({ title: "Error al eliminar" });
        return;
      }
      toast.success({ title: "Suscripción eliminada" });
      onDelete();
    } catch {
      toast.error({ title: "Error de red" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div
        className={`h-1 w-full ${sub.isActive ? "bg-indigo-500" : "bg-gray-300"}`}
      />
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Repeat
                className={`w-4 h-4 flex-shrink-0 ${sub.isActive ? "text-indigo-500" : "text-gray-400"}`}
              />
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {sub.name}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 ml-6">
              {dayLabel(sub.dayOfMonth)}
            </p>
          </div>
          <span
            className={`text-lg font-bold tabular-nums ${sub.isActive ? "text-indigo-600" : "text-gray-400"}`}
          >
            {formatCurrency(sub.amount)}
          </span>
        </div>

        {/* Next charge badge — only shows 3 days before */}
        {sub.isActive && (() => {
          const now = new Date();
          const todayDay = now.getDate();
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const effectiveDay = sub.dayOfMonth > lastDay ? lastDay : sub.dayOfMonth;
          const isToday = todayDay === effectiveDay;
          const daysUntil = effectiveDay > todayDay
            ? effectiveDay - todayDay
            : lastDay - todayDay + effectiveDay;

          if (daysUntil > 3 && !isToday) return null;

          return (
            <div className={`flex flex-col gap-1 px-2.5 py-2 rounded-lg text-xs border ${
              isToday
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                {isToday
                  ? "Se descuenta hoy a las 7:00 PM"
                  : daysUntil === 1
                    ? "Se descuenta mañana a las 7:00 PM"
                    : `Se descuenta en ${daysUntil} días`}
              </div>
              <p className={`text-[11px] ${isToday ? "text-amber-600" : "text-blue-600"}`}>
                No realices esta transferencia manualmente, el cobro es automático.
              </p>
            </div>
          );
        })()}

        {/* Meta */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-gray-500">
            Cuenta: <span className="font-medium">{sub.account.name}</span>
          </span>
          {sub.category && (
            <span
              className="px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: sub.category.color + "20",
                color: sub.category.color,
              }}
            >
              {sub.category.name}
            </span>
          )}
          <span
            className={`ml-auto px-2 py-0.5 rounded-full font-medium ${
              sub.isActive
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-gray-50 text-gray-500 border border-gray-200"
            }`}
          >
            {sub.isActive ? "Activa" : "Pausada"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap pt-1">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
              sub.isActive
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            }`}
          >
            {sub.isActive ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {sub.isActive ? "Pausar" : "Activar"}
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
          {confirmingDelete ? (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? "..." : "Confirmar"}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Componente principal para gestionar suscripciones recurrentes.
 * Permite:
 * - Crear nuevas suscripciones
 * - Editar suscripciones existentes
 * - Pausar/activar suscripciones
 * - Eliminar suscripciones
 * - Filtrar por activas/pausadas
 * - Ver total mensual de suscripciones activas
 * @returns {React.ReactElement} Panel de gestión de suscripciones
 */
export default function SubscriptionsClient() {
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"active" | "paused">("active");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const { data, isLoading: loading } = useQuery<{ data: Subscription[] }>({
    queryKey: ["subscriptions"],
    queryFn: () => fetch("/api/subscriptions").then((r) => r.json()),
  });
  const subscriptions: Subscription[] = data?.data ?? [];

  const active = subscriptions.filter((s) => s.isActive);
  const paused = subscriptions.filter((s) => !s.isActive);
  const totalMonthly = active.reduce((sum, s) => sum + s.amount, 0);
  const displayed = tab === "active" ? active : paused;

  function handleSaved(sub: Subscription) {
    queryClient.setQueryData<{ data: Subscription[] }>(
      ["subscriptions"],
      (old) => {
        const list = old?.data ?? [];
        const exists = list.find((s) => s.id === sub.id);
        if (exists) {
          return { data: list.map((s) => (s.id === sub.id ? sub : s)) };
        }
        return { data: [sub, ...list] };
      }
    );
  }

  function handleToggle(id: string) {
    queryClient.setQueryData<{ data: Subscription[] }>(
      ["subscriptions"],
      (old) => ({
        data: (old?.data ?? []).map((s) =>
          s.id === id ? { ...s, isActive: !s.isActive } : s
        ),
      })
    );
  }

  function handleDelete(id: string) {
    queryClient.setQueryData<{ data: Subscription[] }>(
      ["subscriptions"],
      (old) => ({
        data: (old?.data ?? []).filter((s) => s.id !== id),
      })
    );
  }

  return (
    <div>
      {/* Summary card */}
      <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Repeat className="w-4 h-4 text-indigo-600" />
          <p className="text-xs font-semibold text-indigo-700">
            Gasto mensual en suscripciones
          </p>
        </div>
        <p className="text-xl font-bold text-indigo-600">
          {formatCurrency(totalMonthly)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {active.length} activa{active.length !== 1 ? "s" : ""}
          {paused.length > 0 &&
            ` · ${paused.length} pausada${paused.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Tabs + New button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 mb-4">
        <div className="flex w-full min-w-0 bg-gray-100 rounded-lg p-1 gap-1">
          {(
            [
              ["active", "Activas", active.length],
              ["paused", "Pausadas", paused.length],
            ] as const
          ).map(([val, label, count]) => (
            <button
              key={val}
              type="button"
              onClick={() => setTab(val)}
              className={`flex flex-1 min-w-0 items-center justify-center gap-1 sm:gap-1.5 rounded-md py-2.5 px-2 sm:py-1.5 sm:px-3 md:px-4 text-xs sm:text-sm font-medium transition-all ${
                tab === val
                  ? val === "active"
                    ? "bg-indigo-100 shadow-sm text-indigo-700"
                    : "bg-gray-200 shadow-sm text-gray-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {val === "active" ? (
                <Play
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${tab === val ? "text-indigo-600" : "text-gray-400"}`}
                />
              ) : (
                <Pause
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${tab === val ? "text-gray-600" : "text-gray-400"}`}
                />
              )}
              <span className="truncate">{label}</span>
              {count > 0 && (
                <span
                  className={`flex-shrink-0 text-[10px] sm:text-xs rounded-full px-1 sm:px-1.5 py-0.5 font-semibold tabular-nums ${
                    tab === val
                      ? val === "active"
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-200 text-gray-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm active:bg-indigo-800"
        >
          <Plus className="w-4 h-4 text-white flex-shrink-0" />
          <span className="hidden sm:inline">Nueva suscripción</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="h-1 w-full bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Skeleton width="50%" height={18} className="mb-1" />
                    <Skeleton width="30%" height={12} />
                  </div>
                  <Skeleton width={80} height={28} />
                </div>
                <div className="flex gap-2">
                  <Skeleton width={80} height={30} borderRadius={8} />
                  <Skeleton width={80} height={30} borderRadius={8} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
            <Repeat className="w-7 h-7 text-indigo-600" />
          </div>
          <p className="text-gray-500 font-medium">
            {tab === "active"
              ? subscriptions.length === 0
                ? "No tienes suscripciones registradas"
                : "No hay suscripciones activas"
              : "No hay suscripciones pausadas"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {tab === "active"
              ? "Registra tus cobros recurrentes como Spotify, Netflix, etc."
              : "Las suscripciones pausadas no generan cobros automáticos."}
          </p>
          {tab === "active" && subscriptions.length === 0 && (
            <button
              onClick={() => {
                setEditing(null);
                setShowModal(true);
              }}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium underline"
            >
              Agregar una
            </button>
          )}
          {tab === "paused" && paused.length === 0 && active.length > 0 && (
            <button
              type="button"
              onClick={() => setTab("active")}
              className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Ver activas ({active.length})
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              onToggle={() => handleToggle(sub.id)}
              onEdit={() => {
                setEditing(sub);
                setShowModal(true);
              }}
              onDelete={() => handleDelete(sub.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <SubscriptionModal
          editing={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
