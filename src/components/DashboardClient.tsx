/**
 * @module DashboardClient
 * Panel principal de control financiero con estadísticas, gráficos
 * y resumen de suscripciones próximas.
 */

"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/context/CurrencyContext";
import { Wallet, TrendingUp, TrendingDown, RefreshCw, CalendarClock, PiggyBank } from "lucide-react";
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
import { AccountFilterChips, type AccountFilterChipItem } from "@/components/AccountFilterChips";

/**
 * Props para el componente de leyenda de gráfico
 * @typedef {Object} ChartLegendProps
 * @property {Array<{value: string, color: string}>} [payload] - Items de la leyenda
 */
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

function formatTooltipLabel(label: string) {
  // YYYY-MM-DD → "15 mar 2026"
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    const [y, m, d] = label.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  }
  // YYYY-MM → "mar 2026"
  if (/^\d{4}-\d{2}$/.test(label)) {
    return formatMonthLabel(label);
  }
  // Week label like "01-07" → "Semana 01-07"
  if (/^\d{2}-\d{2}$/.test(label)) {
    return `Semana ${label}`;
  }
  return label;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  const { formatCurrency } = useCurrency();
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md px-4 py-3 text-sm">
      {label && (
        <p className="text-gray-500 text-xs mb-2 font-medium">
          {formatTooltipLabel(label)}
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

interface DailyDataPoint {
  day: string;
  income: number;
  expenses: number;
}

interface WeeklyDataPoint {
  label: string;
  income: number;
  expenses: number;
}

interface BalanceDayPoint {
  day: string;
  label: string;
  balance: number;
}

interface Subscription {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  isActive: boolean;
  accountId: string;
  account: { name: string };
}

function getSubscriptionDaysUntil(dayOfMonth: number): { daysUntil: number; isToday: boolean } {
  const now = new Date();
  const todayDay = now.getDate();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const effectiveDay = dayOfMonth > lastDay ? lastDay : dayOfMonth;
  const isToday = todayDay === effectiveDay;
  const daysUntil = effectiveDay > todayDay
    ? effectiveDay - todayDay
    : lastDay - todayDay + effectiveDay;
  return { daysUntil, isToday };
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

/**
 * Componente principal del dashboard que muestra:
 * - Resumen de finanzas (saldo, ingresos, gastos, suscripciones)
 * - Gráficos de gastos por categoría, ingresos vs gastos y evolución del saldo
 * - Filtrado por cuenta y mes
 * - Próximas suscripciones vencidas
 * @returns {React.ReactElement} Panel de control completamente renderizado
 */
export default function DashboardClient() {
  const { formatCurrency } = useCurrency();
  const [selectedMonth, setSelectedMonth] = useState(getMonthString(new Date()));
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => fetch("/api/accounts").then((r) => r.json()),
  });

  const { data: subsRaw } = useQuery<{ data: Subscription[] }>({
    queryKey: ["subscriptions"],
    queryFn: () => fetch("/api/subscriptions").then((r) => r.json()),
  });
  const subscriptions = subsRaw?.data ?? [];
  const activeSubs = subscriptions
    .filter((s) => s.isActive)
    .filter((s) => !selectedAccountId || s.accountId === selectedAccountId);
  const totalSubsMonthly = activeSubs.reduce((sum, s) => sum + s.amount, 0);
  const upcomingSubs = activeSubs
    .map((s) => ({ ...s, ...getSubscriptionDaysUntil(s.dayOfMonth) }))
    .filter((s) => s.isToday || s.daysUntil <= 3)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  const accounts: AccountFilterChipItem[] = accountsData?.data ?? [];

  const { data: monthStats, isLoading: loadingStats } = useQuery<MonthStats>({
    queryKey: ["stats", selectedMonth, selectedAccountId],
    queryFn: () => {
      const params = new URLSearchParams({ month: selectedMonth });
      if (selectedAccountId) params.set("accountId", selectedAccountId);
      return fetch(`/api/stats?${params}`).then((r) => r.json());
    },
  });

  const { data: dailyRaw, isLoading: loadingDaily } = useQuery<{ data: DailyDataPoint[] }>({
    queryKey: ["stats-daily", selectedMonth, selectedAccountId],
    queryFn: () => {
      const params = new URLSearchParams({ month: selectedMonth });
      if (selectedAccountId) params.set("accountId", selectedAccountId);
      return fetch(`/api/stats/daily?${params}`).then((r) => r.json());
    },
  });
  const dailyData: DailyDataPoint[] = dailyRaw?.data ?? [];

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

  const hasDailyData = dailyData.some((d) => d.income > 0 || d.expenses > 0);

  const savingsRate = monthStats && monthStats.totalIncome > 0
    ? Math.round(((monthStats.totalIncome - monthStats.totalExpenses) / monthStats.totalIncome) * 100)
    : null;

  /** Saldo real según cuentas (GET /api/accounts), coherente con los chips de cuenta */
  const saldoEnCuentas = useMemo(() => {
    if (selectedAccountId) {
      return accounts.find((a) => a.id === selectedAccountId)?.balance ?? 0;
    }
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  }, [accounts, selectedAccountId]);

  /** Datos semanales para Ingresos vs Gastos */
  const weeklyData = useMemo<WeeklyDataPoint[]>(() => {
    if (!dailyData.length) return [];
    const weeks: WeeklyDataPoint[] = [];
    for (let i = 0; i < dailyData.length; i += 7) {
      const chunk = dailyData.slice(i, i + 7);
      const firstDay = chunk[0].day.split("-")[2];
      const lastDay = chunk[chunk.length - 1].day.split("-")[2];
      weeks.push({
        label: `${firstDay}-${lastDay}`,
        income: Math.round(chunk.reduce((s, d) => s + d.income, 0) * 100) / 100,
        expenses: Math.round(chunk.reduce((s, d) => s + d.expenses, 0) * 100) / 100,
      });
    }
    return weeks;
  }, [dailyData]);

  /** Evolución del saldo día a día: reconstruye desde el saldo actual hacia atrás */
  const balanceEvolution = useMemo<BalanceDayPoint[]>(() => {
    if (!dailyData.length || !accounts.length) return [];

    const result: BalanceDayPoint[] = [];
    let balance = saldoEnCuentas;

    for (let i = dailyData.length - 1; i >= 0; i--) {
      const d = dailyData[i];
      result.unshift({
        day: d.day,
        label: d.day.split("-")[2],
        balance: Math.round(balance * 100) / 100,
      });
      balance -= d.income - d.expenses;
    }
    return result;
  }, [dailyData, saldoEnCuentas, accounts.length, selectedMonth]);

  return (
    <div className="space-y-6">
      <AccountFilterChips
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelectAccountId={setSelectedAccountId}
        formatBalance={formatCurrency}
      />

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-5">
              <Skeleton width="50%" height={14} className="mb-3" />
              <Skeleton width="75%" height={32} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center gap-2 mb-1">
                <Wallet
                  className={`w-5 h-5 ${saldoEnCuentas >= 0 ? "text-indigo-600" : "text-red-600"}`}
                />
                <p className="text-sm text-gray-500">
                  {selectedAccountId ? "Saldo de la cuenta" : "Saldo en cuentas"}
                </p>
              </div>
              <p
                className={`text-2xl font-bold ${
                  saldoEnCuentas >= 0 ? "text-indigo-600" : "text-red-600"
                }`}
              >
                {formatCurrency(saldoEnCuentas)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-500">Ingresos del mes</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(monthStats?.totalIncome ?? 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <p className="text-sm text-gray-500">Gastos del mes</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(monthStats?.totalExpenses ?? 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-5 h-5 text-violet-600" />
                <p className="text-sm text-gray-500">Suscripciones / mes</p>
              </div>
              <p className="text-2xl font-bold text-violet-600">
                {formatCurrency(totalSubsMonthly)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {activeSubs.length} activa{activeSubs.length !== 1 ? "s" : ""}
                {subscriptions.length - activeSubs.length > 0 && (
                  <span> · {subscriptions.length - activeSubs.length} pausada{subscriptions.length - activeSubs.length !== 1 ? "s" : ""}</span>
                )}
              </p>
            </div>
          </div>

          {/* Flujo neto + Tasa de ahorro */}
          {!loadingStats && monthStats && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 px-1">
              <p>
                <span className="font-medium text-gray-700">Flujo neto:</span>{" "}
                <span className={monthStats.balance >= 0 ? "text-indigo-600 font-semibold" : "text-red-600 font-semibold"}>
                  {formatCurrency(monthStats.balance)}
                </span>
              </p>
              {savingsRate !== null && (
                <p className="flex items-center gap-1">
                  <PiggyBank className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-700">Ahorro:</span>{" "}
                  <span className={savingsRate >= 0 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                    {savingsRate}%
                  </span>
                </p>
              )}
              <span className="text-gray-400 capitalize">{formatMonthLabel(selectedMonth)}</span>
              {selectedAccountId && (
                <span className="text-gray-400">(cuenta filtrada)</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Próximos cobros de suscripciones */}
      {upcomingSubs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-700">Próximos cobros</h2>
          </div>
          <div className="space-y-2">
            {upcomingSubs.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sub.isToday ? "bg-amber-500" : "bg-blue-500"}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{sub.name}</p>
                    <p className="text-xs text-gray-400">{sub.account.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(sub.amount)}</p>
                  <p className={`text-xs font-medium ${sub.isToday ? "text-amber-600" : "text-blue-600"}`}>
                    {sub.isToday ? "Hoy" : sub.daysUntil === 1 ? "Mañana" : `En ${sub.daysUntil} días`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
            <ResponsiveContainer width="100%" height={250}>
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

        {/* Weekly Chart - Ingresos vs Gastos por semana */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Ingresos vs Gastos
          </h2>
          {loadingDaily ? (
            <div className="p-2">
              <Skeleton height={250} borderRadius={8} />
            </div>
          ) : !hasDailyData ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">Sin transacciones en este período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
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

        {/* Daily Balance Evolution Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Evolución del saldo
          </h2>
          {loadingDaily ? (
            <div className="p-2">
              <Skeleton height={250} borderRadius={8} />
            </div>
          ) : balanceEvolution.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">Sin datos suficientes</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={balanceEvolution} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={60} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Saldo"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
