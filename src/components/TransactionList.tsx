"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

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

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        type === "INCOME"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {type === "INCOME" ? "Ingreso" : "Gasto"}
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
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
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
      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
      title="Eliminar transacción"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  );
}

export default function TransactionList() {
  const router = useRouter();
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
        await fetchTransactions();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  const inputBase =
    "rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-200";

  return (
    <div className="space-y-4">
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
              Cuenta
            </label>
            <select
              value={accountIdParam}
              onChange={(e) => updateParams({ accountId: e.target.value })}
              className={inputBase}
            >
              <option value="">Todas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
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

          {(typeParam || categoryIdParam || accountIdParam || dateFromParam || dateToParam) && (
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
              className="text-xs text-gray-500 hover:text-gray-700 underline self-end pb-1.5"
            >
              Limpiar filtros
            </button>
          )}

          <div className="ml-auto self-end">
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {isExporting ? "Exportando..." : "Exportar CSV"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm text-center">
          <div className="text-gray-400 text-sm">Cargando transacciones...</div>
        </div>
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
          <div className="hidden sm:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuenta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-3" />
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
                      {t.account.name}
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
                      <DeleteButton
                        id={t.id}
                        confirmId={deleteConfirmId}
                        isDeleting={isDeleting}
                        onRequestDelete={(id) => setDeleteConfirmId(id)}
                        onConfirmDelete={handleConfirmDelete}
                        onCancelDelete={() => setDeleteConfirmId(null)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {t.description ?? (
                        <span className="text-gray-400 italic font-normal">
                          Sin descripción
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(t.date)}
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold ${
                        t.type === "INCOME" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatAmount(t.amount, t.type)}
                    </p>
                    <div className="mt-0.5">
                      <TypeBadge type={t.type} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CategoryBadge
                      name={t.category.name}
                      color={t.category.color}
                    />
                    <span className="text-xs text-gray-400">
                      {t.account.name}
                    </span>
                  </div>
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
            ))}
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
    </div>
  );
}
