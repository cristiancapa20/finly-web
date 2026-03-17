"use client";

import { useState, useEffect, useCallback } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "@/lib/toast";
import { useSearchParams, usePathname } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Tag,
  Trash2,
  Pencil,
  X,
  Download,
  CalendarDays,
  ArrowUpDown,
  DollarSign,
  AlignLeft,
} from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";

interface Category {
  id: string;
  name: string;
}

interface Account {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  date: string;
  category: { id: string; name: string; color: string };
  account: { id: string; name: string };
}

interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

const LIMIT = 20;


function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatAmount(amount: number, type: string) {
  const sign = type === "INCOME" ? "+" : "-";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

function getDateParts(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const dayName = d
    .toLocaleDateString("es-ES", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
  const month = d
    .toLocaleDateString("es-ES", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  return { day, dayName, month };
}

function TypeBadge({ type }: { type: string }) {
  const isIncome = type === "INCOME";
  const Icon = isIncome ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        isIncome ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      <Icon className="w-3 h-3" />
      {isIncome ? "Ingreso" : "Gasto"}
    </span>
  );
}

function CategoryBadge({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  const Icon = getCategoryIcon(name);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: color + "22" }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </span>
      <span className="text-sm text-gray-700">{name}</span>
    </span>
  );
}

interface DeleteButtonProps {
  id: string;
  confirmId: string | null;
  isDeleting: boolean;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}

function DeleteButton({
  id,
  confirmId,
  isDeleting,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: DeleteButtonProps) {
  if (confirmId === id) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={() => onConfirmDelete(id)}
          disabled={isDeleting}
          className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? "..." : "Confirmar"}
        </button>
        <button
          onClick={onCancelDelete}
          disabled={isDeleting}
          className="px-2 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => onRequestDelete(id)}
      className="p-1.5 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
      title="Eliminar transacción"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

interface EditModalProps {
  transaction: Transaction;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

function EditModal({ transaction: t, categories, accounts, onClose, onSaved }: EditModalProps) {
  const [form, setForm] = useState({
    amount: String(t.amount),
    type: t.type,
    categoryId: t.category.id,
    accountId: t.account.id,
    description: t.description ?? "",
    date: t.date.split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.amount),
          type: form.type,
          categoryId: form.categoryId,
          accountId: form.accountId,
          description: form.description || null,
          date: form.date,
        }),
      });
      if (res.ok) {
        await res.json();
        toast.success({ title: "Transacción actualizada" });
        await onSaved();
      } else {
        toast.error({ title: "Error al actualizar la transacción" });
      }
    } catch {
      toast.error({ title: "Error de red" });
    } finally {
      setSaving(false);
    }
  }

  const inputBase = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Editar transacción</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Monto</label>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => update("amount", e.target.value)} className={inputBase} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
            <select value={form.type} onChange={(e) => update("type", e.target.value)} className={inputBase} required>
              <option value="INCOME">Ingreso</option>
              <option value="EXPENSE">Gasto</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
            <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} className={inputBase} required>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cuenta</label>
            <select value={form.accountId} onChange={(e) => update("accountId", e.target.value)} className={inputBase} required>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
            <input type="text" value={form.description} onChange={(e) => update("description", e.target.value)} className={inputBase} placeholder="Sin descripción" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
            <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className={inputBase} required />
          </div>
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TransactionList() {
  const router = useTransitionRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const typeParam = searchParams.get("type") ?? "";
  const categoryIdParam = searchParams.get("categoryId") ?? "";
  const accountIdParam = searchParams.get("accountId") ?? "";
  const dateFromParam = searchParams.get("dateFrom") ?? "";
  const dateToParam = searchParams.get("dateTo") ?? "";
  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ]).then(([catRes, accRes]) => {
      if (catRes.data) setCategories(catRes.data);
      if (accRes.data) setAccounts(accRes.data);
    });
  }, []);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (typeParam) params.set("type", typeParam);
    if (categoryIdParam) params.set("categoryId", categoryIdParam);
    if (accountIdParam) params.set("accountId", accountIdParam);
    if (dateFromParam) params.set("dateFrom", dateFromParam);
    if (dateToParam) params.set("dateTo", dateToParam);
    params.set("page", String(pageParam));
    params.set("limit", String(LIMIT));

    try {
      const res = await fetch(`/api/transactions?${params}`);
      const data: TransactionsResponse = await res.json();
      setTransactions(data.data ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setIsLoading(false);
    }
  }, [typeParam, categoryIdParam, accountIdParam, dateFromParam, dateToParam, pageParam]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  async function handleSaved() {
    await fetchTransactions();
    setEditingTransaction(null);
  }

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    if (!("page" in updates)) {
      params.set("page", "1");
    }
    router.push(`${pathname}?${params}`);
  }

  async function handleExportCsv() {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (typeParam) params.set("type", typeParam);
      if (categoryIdParam) params.set("categoryId", categoryIdParam);
      if (accountIdParam) params.set("accountId", accountIdParam);
      if (dateFromParam) params.set("dateFrom", dateFromParam);
      if (dateToParam) params.set("dateTo", dateToParam);

      const res = await fetch(`/api/transactions/export?${params}`);
      if (!res.ok) return;

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : "transacciones.csv";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleConfirmDelete(id: string) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirmId(null);
        toast.success({ title: "Transacción eliminada" });
        await fetchTransactions();
      } else {
        toast.error({ title: "Error al eliminar la transacción" });
      }
    } catch {
      toast.error({ title: "Error de red al eliminar la transacción" });
    } finally {
      setIsDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  const inputBase =
    "rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-200";

  return (
    <div className="space-y-4">
      {/* Account Switcher */}
      {accounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateParams({ accountId: "" })}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              accountIdParam === ""
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
            }`}
          >
            Todas
          </button>
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => updateParams({ accountId: account.id })}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                accountIdParam === account.id
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              {account.name}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tipo
            </label>
            <select
              value={typeParam}
              onChange={(e) => updateParams({ type: e.target.value })}
              className={inputBase}
            >
              <option value="">Todos</option>
              <option value="INCOME">Ingreso</option>
              <option value="EXPENSE">Gasto</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Categoría
            </label>
            <select
              value={categoryIdParam}
              onChange={(e) => updateParams({ categoryId: e.target.value })}
              className={inputBase}
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={dateFromParam}
              onChange={(e) => updateParams({ dateFrom: e.target.value })}
              className={inputBase}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={dateToParam}
              onChange={(e) => updateParams({ dateTo: e.target.value })}
              className={inputBase}
            />
          </div>

          <button
            onClick={() =>
              updateParams({
                type: "",
                categoryId: "",
                accountId: "",
                dateFrom: "",
                dateTo: "",
              })
            }
            disabled={!typeParam && !categoryIdParam && !accountIdParam && !dateFromParam && !dateToParam}
            className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-300 rounded-md hover:bg-red-50 self-end disabled:opacity-0 disabled:pointer-events-none transition-colors"
          >
            Limpiar filtros
          </button>

          <div className="ml-auto self-end">
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Exportando..." : "Exportar CSV"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <>
          {/* Desktop skeleton */}
          <div className="hidden sm:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <Skeleton width={300} height={14} />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
                <Skeleton width={80} height={14} />
                <Skeleton width={160} height={14} />
                <Skeleton width={90} height={24} borderRadius={12} />
                <Skeleton width={80} height={14} />
                <Skeleton width={60} height={22} borderRadius={4} />
                <Skeleton width={70} height={14} className="ml-auto" />
              </div>
            ))}
          </div>
          {/* Mobile skeleton */}
          <div className="sm:hidden space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex">
                <div className="bg-gray-100 flex flex-col items-center justify-center px-3 py-3 min-w-[58px] border-r border-gray-200 flex-shrink-0">
                  <Skeleton circle width={32} height={32} />
                </div>
                <div className="flex flex-col flex-1 p-3 gap-2">
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="40%" height={12} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 shadow-sm text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-500 font-medium">No hay transacciones</p>
          <p className="text-gray-400 text-sm mt-1">
            {typeParam || categoryIdParam || dateFromParam || dateToParam
              ? "Prueba ajustando los filtros"
              : "Aún no has registrado ninguna transacción"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />Fecha</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1"><AlignLeft className="w-3.5 h-3.5" />Descripción</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1"><Tag className="w-3.5 h-3.5" />Categoría</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1"><Wallet className="w-3.5 h-3.5" />Cuenta</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1"><ArrowUpDown className="w-3.5 h-3.5" />Tipo</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="inline-flex items-center justify-end gap-1"><DollarSign className="w-3.5 h-3.5" />Monto</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                      {t.description ?? (
                        <span className="text-gray-400 italic">Sin descripción</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CategoryBadge
                        name={t.category.name}
                        color={t.category.color}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-gray-400" />
                        {t.account.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <TypeBadge type={t.type} />
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium text-right whitespace-nowrap ${
                        t.type === "INCOME"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatAmount(t.amount, t.type)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingTransaction(t)}
                          className="p-1.5 rounded-md text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Editar transacción"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <DeleteButton
                          id={t.id}
                          confirmId={deleteConfirmId}
                          isDeleting={isDeleting}
                          onRequestDelete={(id) => setDeleteConfirmId(id)}
                          onConfirmDelete={handleConfirmDelete}
                          onCancelDelete={() => setDeleteConfirmId(null)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {transactions.map((t) => {
              const { day, dayName, month } = getDateParts(t.date);
              return (
                <div
                  key={t.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex"
                >
                  {/* Left date panel */}
                  <div className="bg-gray-100 flex flex-col items-center justify-center px-3 py-3 min-w-[58px] border-r border-gray-200 flex-shrink-0">
                    <span className="text-2xl font-bold text-gray-800 leading-none">{day}</span>
                    <span className="text-xs font-medium text-gray-500 mt-0.5">{dayName}</span>
                    <span className="text-xs text-gray-400 mt-0.5">{month}</span>
                  </div>

                  {/* Right content */}
                  <div className="flex flex-col flex-1 min-w-0">
                    {/* Main content */}
                    <div className="flex items-start justify-between px-3 pt-3 pb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {t.description ?? (
                            <span className="text-gray-400 italic font-normal">Sin descripción</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <CategoryBadge name={t.category.name} color={t.category.color} />
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <Wallet className="w-3 h-3" />
                            {t.account.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p
                          className={`text-sm font-bold ${
                            t.type === "INCOME" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatAmount(t.amount, t.type)}
                        </p>
                      </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                      <TypeBadge type={t.type} />
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => setEditingTransaction(t)}
                          className="p-1.5 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <DeleteButton
                          id={t.id}
                          confirmId={deleteConfirmId}
                          isDeleting={isDeleting}
                          onRequestDelete={(id) => setDeleteConfirmId(id)}
                          onConfirmDelete={handleConfirmDelete}
                          onCancelDelete={() => setDeleteConfirmId(null)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
              <p className="text-sm text-gray-500">
                Mostrando{" "}
                <span className="font-medium">
                  {(pageParam - 1) * LIMIT + 1}–
                  {Math.min(pageParam * LIMIT, total)}
                </span>{" "}
                de <span className="font-medium">{total}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => updateParams({ page: String(pageParam - 1) })}
                  disabled={pageParam <= 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => updateParams({ page: String(pageParam + 1) })}
                  disabled={pageParam >= totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {editingTransaction && (
        <EditModal
          transaction={editingTransaction}
          categories={categories}
          accounts={accounts}
          onClose={() => setEditingTransaction(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
