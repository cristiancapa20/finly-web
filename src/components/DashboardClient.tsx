"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
interface ChartLegendProps {
  payload?: { value: string; color: string }[];
}

function RoundedLegend({ payload }: ChartLegendProps) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
      {payload.map((entry, i) => (
        <span key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
          <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </span>
      ))}
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md px-4 py-3 text-sm">
      {label && (
        <p className="text-gray-500 text-xs mb-2 font-medium">
          {formatMonthLabel(label)}
        </p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface ExpensesByCategory {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
}

interface MonthStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expensesByCategory: ExpensesByCategory[];
}

interface MonthlyDataPoint {
  month: string;
  income: number;
  expenses: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatMonthLabel(yyyyMm: string) {
  const [year, month] = yyyyMm.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("es-MX", { month: "short", year: "numeric" });
}

function getMonthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(yyyyMm: string, delta: number) {
  const [year, month] = yyyyMm.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return getMonthString(d);
}

interface Account {
  id: string;
  name: string;
}

export default function DashboardClient() {
  const [selectedMonth, setSelectedMonth] = useState(getMonthString(new Date()));
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [monthStats, setMonthStats] = useState<MonthStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(true);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: { data?: Account[] }) => {
        if (data.data) setAccounts(data.data);
      });
  }, []);

  const fetchMonthStats = useCallback(async (month: string, accountId: string) => {
    setLoadingStats(true);
    try {
      const params = new URLSearchParams({ month });
      if (accountId) params.set("accountId", accountId);
      const res = await fetch(`/api/stats?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMonthStats(data);
      }
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchMonthlyData = useCallback(async (accountId: string) => {
    setLoadingMonthly(true);
    try {
      const params = new URLSearchParams({ months: "6" });
      if (accountId) params.set("accountId", accountId);
      const res = await fetch(`/api/stats/monthly?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyData(data.data);
      }
    } finally {
      setLoadingMonthly(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthStats(selectedMonth, selectedAccountId);
  }, [selectedMonth, selectedAccountId, fetchMonthStats]);

  useEffect(() => {
    fetchMonthlyData(selectedAccountId);
  }, [selectedAccountId, fetchMonthlyData]);

  const handlePrev = () => setSelectedMonth((m) => addMonths(m, -1));
  const handleNext = () => {
    const next = addMonths(selectedMonth, 1);
    if (next <= getMonthString(new Date())) {
      setSelectedMonth(next);
    }
  };
  const isCurrentMonth = selectedMonth >= getMonthString(new Date());

  const hasMonthData =
    monthStats &&
    (monthStats.totalIncome > 0 ||
      monthStats.totalExpenses > 0 ||
      monthStats.balance !== 0);

  const hasMonthlyData = monthlyData.some((d) => d.income > 0 || d.expenses > 0);

  return (
    <div className="space-y-6">
      {/* Account Switcher */}
      {accounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (document.startViewTransition) {
                document.startViewTransition(() => setSelectedAccountId(""));
              } else {
                setSelectedAccountId("");
              }
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              selectedAccountId === ""
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
            }`}
          >
            Todas
          </button>
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => {
                if (document.startViewTransition) {
                  document.startViewTransition(() => setSelectedAccountId(account.id));
                } else {
                  setSelectedAccountId(account.id);
                }
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                selectedAccountId === account.id
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              {account.name}
            </button>
          ))}
        </div>
      )}

      {/* Month Selector */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePrev}
          className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors"
          aria-label="Mes anterior"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-lg font-semibold text-gray-800 min-w-[140px] text-center capitalize">
          {formatMonthLabel(selectedMonth)}
        </span>
        <button
          onClick={handleNext}
          disabled={isCurrentMonth}
          className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Mes siguiente"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Summary Cards */}
      {loadingStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-5">
              <Skeleton width="50%" height={14} className="mb-3" />
              <Skeleton width="75%" height={32} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className={`w-5 h-5 ${(monthStats?.balance ?? 0) >= 0 ? "text-indigo-600" : "text-red-600"}`} />
              <p className="text-sm text-gray-500">Balance del mes</p>
            </div>
            <p
              className={`text-2xl font-bold ${
                (monthStats?.balance ?? 0) >= 0 ? "text-indigo-600" : "text-red-600"
              }`}
            >
              {formatCurrency(monthStats?.balance ?? 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <p className="text-sm text-gray-500">Total Ingresos</p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(monthStats?.totalIncome ?? 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <p className="text-sm text-gray-500">Total Gastos</p>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(monthStats?.totalExpenses ?? 0)}
            </p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart - Expenses by Category */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Gastos por categoría
          </h2>
          {loadingStats ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Skeleton circle width={160} height={160} />
              <Skeleton width={200} height={14} />
            </div>
          ) : !hasMonthData || (monthStats?.expensesByCategory?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">Sin transacciones en este período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={monthStats!.expensesByCategory.map((e) => ({
                    ...e,
                    name: e.categoryName,
                    value: e.total,
                    fill: e.color,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="68%"
                  outerRadius="88%"
                  cornerRadius="50%"
                  paddingAngle={5}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<RoundedLegend />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart - Last 6 months */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Ingresos vs Gastos (últimos 6 meses)
          </h2>
          {loadingMonthly ? (
            <div className="p-2">
              <Skeleton height={250} borderRadius={8} />
            </div>
          ) : !hasMonthlyData ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">Sin transacciones en este período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonthLabel}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={60} />
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<RoundedLegend />} />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Ingresos"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#fff", stroke: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Gastos"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#fff", stroke: "#ef4444", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
