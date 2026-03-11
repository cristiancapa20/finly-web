"use client";

import { useState, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "@/lib/toast";
import { Plus, X, Trash2, ChevronDown, ChevronUp, CheckCircle, RotateCcw, CreditCard, HandCoins, Bell, AlertTriangle } from "lucide-react";

interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
  account: LoanAccount | null;
}

interface LoanAccount {
  id: string;
  name: string;
}

interface Loan {
  id: string;
  type: "LENT" | "OWED";
  contactName: string;
  amount: number;
  remaining: number;
  description: string | null;
  dueDate: string | null;
  status: "ACTIVE" | "PAID";
  reminderDays: number | null;
  createdAt: string;
  payments: LoanPayment[];
  account: LoanAccount | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string | null) => {
  if (!s) return null;
  return new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

const today = () => new Date().toISOString().split("T")[0];

function dueDateStatus(dueDate: string | null, status: string) {
  if (!dueDate || status === "PAID") return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Venció hace ${Math.abs(diffDays)}d`, cls: "text-red-600 bg-red-50 border-red-200" };
  if (diffDays <= 7) return { label: `Vence en ${diffDays}d`, cls: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: `Vence ${fmtDate(dueDate)}`, cls: "text-gray-500 bg-gray-50 border-gray-200" };
}

function ProgressBar({ total, remaining }: { total: number; remaining: number }) {
  const pct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Pagado {pct}%</span>
        <span>Restante {fmt(remaining)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-indigo-500" : "bg-amber-400"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}


/* ─── New Loan Modal ─── */
function NewLoanModal({ onClose, onCreated }: { onClose: () => void; onCreated: (loan: Loan) => void }) {
  const [form, setForm] = useState({ type: "OWED", contactName: "", amount: "", dueDate: "", description: "", reminderDays: "", accountId: "" });
  const [accounts, setAccounts] = useState<LoanAccount[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data) => setAccounts(data.data ?? []))
      .finally(() => setAccountsLoaded(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contactName.trim() || !form.amount || !form.accountId) return;
    if (form.type === "OWED" && form.dueDate && form.dueDate < today()) {
      toast.error({ title: "Fecha inválida", description: "La fecha de vencimiento no puede ser anterior a hoy." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          contactName: form.contactName,
          amount: parseFloat(form.amount),
          dueDate: form.dueDate || null,
          description: form.description || null,
          reminderDays: form.reminderDays ? parseInt(form.reminderDays) : null,
          accountId: form.accountId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error({ title: "Error", description: data.error }); return; }
      toast.success({ title: "Registrado correctamente" });
      onCreated(data.data);
      onClose();
    } catch { toast.error({ title: "Error de red" }); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-200 transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Nuevo registro</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            {([["OWED", "Debo dinero", "bg-red-50 border-red-300 text-red-700"], ["LENT", "Me deben dinero", "bg-green-50 border-green-300 text-green-700"]] as const).map(([val, label, cls]) => (
              <button
                key={val}
                type="button"
                onClick={() => setForm(f => ({
                  ...f,
                  type: val,
                  dueDate: val === "OWED" && f.dueDate && f.dueDate < today() ? "" : f.dueDate,
                }))}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${form.type === val ? cls : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Contact */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {form.type === "OWED" ? "¿A quién le debo?" : "¿Quién me debe?"}
            </label>
            <input
              type="text"
              value={form.contactName}
              onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
              className={inputCls}
              placeholder="Nombre de la persona o entidad"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Monto total</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className={inputCls}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {form.type === "OWED" ? "Cuenta donde recibiste el dinero" : "Cuenta desde la que prestaste"}
            </label>
            <select
              value={form.accountId}
              onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
              className={inputCls}
              required
              disabled={!accountsLoaded || accounts.length === 0}
            >
              <option value="">{accountsLoaded ? "Selecciona una cuenta" : "Cargando cuentas..."}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
            {accountsLoaded && accounts.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Debes crear una cuenta antes de registrar préstamos o deudas.</p>
            )}
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de vencimiento <span className="text-gray-400">(opcional)</span></label>
            <input
              type="date"
              value={form.dueDate}
              min={form.type === "OWED" ? today() : undefined}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value, reminderDays: "" }))}
              className={inputCls}
            />
            {form.type === "OWED" && (
              <p className="text-xs text-gray-400 mt-1">Las deudas deben vencer a partir de hoy.</p>
            )}
          </div>

          {/* Reminder */}
          {form.dueDate && (() => {
            const daysUntilDue = Math.ceil((new Date(form.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const allOptions = [
              { value: "1", label: "1 día antes" },
              { value: "3", label: "3 días antes" },
              { value: "7", label: "1 semana antes" },
              { value: "15", label: "15 días antes" },
              { value: "30", label: "1 mes antes" },
            ];
            const validOptions = allOptions.filter(o => parseInt(o.value) <= daysUntilDue);
            if (validOptions.length === 0) return null;
            return (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Bell className="w-3 h-3 inline mr-1 text-indigo-500" />
                  Avisarme antes del vencimiento <span className="text-gray-400">(opcional)</span>
                </label>
                <select
                  value={form.reminderDays}
                  onChange={e => setForm(f => ({ ...f, reminderDays: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Sin recordatorio</option>
                  {validOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            );
          })()}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notas <span className="text-gray-400">(opcional)</span></label>
            <textarea
              value={form.description}
              onChange={e => {
                setForm(f => ({ ...f, description: e.target.value }));
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
              }}
              className={`${inputCls} resize-none min-h-[64px] overflow-hidden`}
              placeholder="Contexto adicional..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || !form.contactName.trim() || !form.amount || !form.accountId || accounts.length === 0}
              className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Guardando..." : "Guardar"}
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

/* ─── Add Payment Modal ─── */

function AddPaymentModal({ loan, onClose, onAdded }: { loan: Loan; onClose: () => void; onAdded: (payment: LoanPayment) => void }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<LoanAccount[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data) => {
        const fetchedAccounts = data.data ?? [];
        setAccounts(fetchedAccounts);
        setAccountId(loan.account?.id ?? fetchedAccounts[0]?.id ?? "");
      })
      .finally(() => setAccountsLoaded(true));
  }, [loan.account?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date || !accountId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${loan.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount), date, note: note || null, accountId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error({ title: "Error", description: data.error }); return; }
      toast.success({ title: "Pago registrado" });
      onAdded(data.data);
      onClose();
    } catch { toast.error({ title: "Error de red" }); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-200 transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Registrar pago</h2>
            <p className="text-xs text-gray-500 mt-0.5">Restante: {fmt(loan.remaining)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Monto pagado</label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} placeholder="0.00" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha del pago</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {loan.type === "LENT" ? "Cuenta donde recibiste el pago" : "Cuenta desde la que pagaste"}
            </label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className={inputCls}
              required
              disabled={!accountsLoaded || accounts.length === 0}
            >
              <option value="">{accountsLoaded ? "Selecciona una cuenta" : "Cargando cuentas..."}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nota <span className="text-gray-400">(opcional)</span></label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} className={inputCls} placeholder="Ej: Transferencia, efectivo..." />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading || !amount || !date || !accountId || accounts.length === 0} className="flex-1 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? "Guardando..." : "Registrar pago"}
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

/* ─── Loan Card ─── */
function LoanCard({
  loan, onDelete, onPaymentAdded, onStatusToggled,
}: {
  loan: Loan;
  onDelete: (id: string) => void;
  onPaymentAdded: (loanId: string, payment: LoanPayment) => void;
  onStatusToggled: (updated: Loan) => void;
}) {
  const [showPayments, setShowPayments] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const due = dueDateStatus(loan.dueDate, loan.status);
  const isLent = loan.type === "LENT";

  // Alerta inline: vencido o dentro del período de recordatorio
  const alertDiffDays = loan.dueDate && loan.status === "ACTIVE"
    ? Math.ceil((new Date(loan.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isOverdueAlert = alertDiffDays !== null && alertDiffDays < 0;
  const isUpcomingAlert = alertDiffDays !== null && alertDiffDays >= 0 && !!loan.reminderDays && alertDiffDays <= loan.reminderDays;
  const showInlineAlert = isOverdueAlert || isUpcomingAlert;

  async function toggleStatus() {
    setToggling(true);
    try {
      const res = await fetch(`/api/loans/${loan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: loan.status === "PAID" ? "ACTIVE" : "PAID" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error({ title: "Error", description: data.error }); return; }
      onStatusToggled(data.data);
    } catch { toast.error({ title: "Error de red" }); }
    finally { setToggling(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/loans/${loan.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error({ title: "Error al eliminar" }); return; }
      toast.success({ title: "Eliminado" });
      onDelete(loan.id);
    } catch { toast.error({ title: "Error de red" }); }
    finally { setDeleting(false); }
  }

  async function deletePayment(paymentId: string) {
    setDeletingPaymentId(paymentId);
    try {
      const res = await fetch(`/api/loans/${loan.id}/payments/${paymentId}`, { method: "DELETE" });
      if (!res.ok) { toast.error({ title: "Error al eliminar pago" }); return; }
      // refresh loan
      const updatedRes = await fetch(`/api/loans`);
      const updatedData = await updatedRes.json();
      const updated = updatedData.data?.find((l: Loan) => l.id === loan.id);
      if (updated) onStatusToggled(updated);
      toast.success({ title: "Pago eliminado" });
    } catch { toast.error({ title: "Error de red" }); }
    finally { setDeletingPaymentId(null); }
  }

  return (
    <>
      <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
        loan.status === "PAID" ? "border-gray-200 opacity-75"
        : isOverdueAlert ? "border-red-400"
        : isUpcomingAlert ? "border-amber-300"
        : isLent ? "border-green-200" : "border-red-200"
      }`}>
        {/* Color strip */}
        <div className={`h-1 w-full ${
          loan.status === "PAID" ? "bg-gray-300"
          : isOverdueAlert ? "bg-red-500"
          : isUpcomingAlert ? "bg-amber-400"
          : isLent ? "bg-green-400" : "bg-red-400"
        }`} />

        {/* Inline alert */}
        {showInlineAlert && (
          <div className={`flex items-center gap-2 px-4 py-2 border-b ${
            isOverdueAlert
              ? "bg-red-50 border-red-100"
              : "bg-amber-50 border-amber-100"
          }`}>
            <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${isOverdueAlert ? "text-red-500" : "text-amber-500"}`} />
            <p className={`text-xs font-medium ${isOverdueAlert ? "text-red-700" : "text-amber-700"}`}>
              {isOverdueAlert
                ? `Venció hace ${Math.abs(alertDiffDays!)} día${Math.abs(alertDiffDays!) !== 1 ? "s" : ""}`
                : `Vence en ${alertDiffDays} día${alertDiffDays !== 1 ? "s" : ""}`
              }
            </p>
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-base">{loan.contactName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${loan.status === "PAID" ? "bg-green-50 text-green-700 border-green-200" : isLent ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {loan.status === "PAID" ? "Pagado" : isLent ? "Me deben" : "Debo"}
                </span>
              </div>
              {loan.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{loan.description}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-gray-900">{fmt(loan.amount)}</p>
              <p className="text-xs text-gray-500">total</p>
            </div>
          </div>

          {/* Progress */}
          {loan.status !== "PAID" && <ProgressBar total={loan.amount} remaining={loan.remaining} />}

          {/* Due date + createdAt */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {loan.account && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full border font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
                Cuenta inicial: {loan.account.name}
              </span>
            )}
            {due && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium ${due.cls}`}>
                {due.label}
              </span>
            )}
            {loan.dueDate && loan.status === "PAID" && (
              <span className="text-gray-400">Vencía {fmtDate(loan.dueDate)}</span>
            )}
            <span className="text-gray-400 ml-auto">Creado {fmtDate(loan.createdAt)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap pt-1">
            {loan.status !== "PAID" && (
              <button
                onClick={() => setShowAddPayment(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {isLent ? "Me pagaron" : "Registrar pago"}
              </button>
            )}
            <button
              onClick={toggleStatus}
              disabled={toggling}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${loan.status === "PAID" ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200" : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"}`}
            >
              {loan.status === "PAID" ? <RotateCcw className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
              {loan.status === "PAID" ? "Reactivar" : "Marcar pagado"}
            </button>
            {loan.payments.length > 0 && (
              <button
                onClick={() => setShowPayments(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                {showPayments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {loan.payments.length} pago{loan.payments.length !== 1 ? "s" : ""}
              </button>
            )}
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

          {/* Payments list */}
          {showPayments && loan.payments.length > 0 && (
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-medium text-gray-600">Historial de pagos</p>
              {loan.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium text-gray-900">{fmt(p.amount)}</span>
                    {p.note && <span className="text-gray-500 ml-1.5 text-xs">· {p.note}</span>}
                    <p className="text-xs text-gray-400">{fmtDate(p.date)}</p>
                    {p.account && <p className="text-xs text-gray-400">Cuenta: {p.account.name}</p>}
                  </div>
                  <button
                    onClick={() => deletePayment(p.id)}
                    disabled={deletingPaymentId === p.id}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddPayment && (
        <AddPaymentModal
          loan={loan}
          onClose={() => setShowAddPayment(false)}
          onAdded={(payment) => {
            onPaymentAdded(loan.id, payment);
            setShowPayments(true);
          }}
        />
      )}
    </>
  );
}

/* ─── Main Component ─── */
export default function LoansClient() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"OWED" | "LENT">("OWED");
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetch("/api/loans")
      .then(r => r.json())
      .then(d => { if (d.data) setLoans(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const owned = loans.filter(l => l.type === "OWED");
  const lent  = loans.filter(l => l.type === "LENT");
  const displayed = tab === "OWED" ? owned : lent;

  // Totals
  const totalOwed    = owned.filter(l => l.status === "ACTIVE").reduce((s, l) => s + l.remaining, 0);
  const totalLent    = lent.filter(l => l.status === "ACTIVE").reduce((s, l) => s + l.remaining, 0);

  function handleCreated(loan: Loan) {
    setLoans(prev => [loan, ...prev]);
    setTab(loan.type);
  }

  function handleDelete(id: string) {
    setLoans(prev => prev.filter(l => l.id !== id));
  }

  function handlePaymentAdded(loanId: string, payment: LoanPayment) {
    setLoans(prev => prev.map(l => {
      if (l.id !== loanId) return l;
      const newPayments = [payment, ...l.payments];
      const paidTotal = newPayments.reduce((s, p) => s + p.amount, 0);
      const newRemaining = Math.max(0, l.amount - paidTotal);
      const newStatus = paidTotal >= l.amount ? "PAID" : l.status;
      return { ...l, payments: newPayments, remaining: newRemaining, status: newStatus };
    }));
  }

  function handleStatusToggled(updated: Loan) {
    setLoans(prev => prev.map(l => l.id === updated.id ? updated : l));
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-red-500" />
            <p className="text-xs font-medium text-gray-600">Total que debo</p>
          </div>
          <p className="text-xl font-bold text-red-600">{fmt(totalOwed)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{owned.filter(l => l.status === "ACTIVE").length} activa{owned.filter(l => l.status === "ACTIVE").length !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <HandCoins className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-gray-600">Total que me deben</p>
          </div>
          <p className="text-xl font-bold text-green-600">{fmt(totalLent)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{lent.filter(l => l.status === "ACTIVE").length} activa{lent.filter(l => l.status === "ACTIVE").length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Tabs + New button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {([["OWED", "Mis deudas", owned.length], ["LENT", "Me deben", lent.length]] as const).map(([val, label, count]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${tab === val ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              {label}
              {count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${tab === val ? (val === "OWED" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600") : "bg-gray-200 text-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo registro</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Skeleton width="50%" height={18} className="mb-1" />
                    <Skeleton width="30%" height={12} />
                  </div>
                  <Skeleton width={80} height={28} />
                </div>
                <Skeleton height={8} borderRadius={4} />
                <div className="flex gap-2">
                  <Skeleton width={110} height={30} borderRadius={8} />
                  <Skeleton width={110} height={30} borderRadius={8} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${tab === "OWED" ? "bg-red-50" : "bg-green-50"}`}>
            {tab === "OWED" ? <CreditCard className="w-7 h-7 text-red-400" /> : <HandCoins className="w-7 h-7 text-green-400" />}
          </div>
          <p className="text-gray-500 font-medium">
            {tab === "OWED" ? "No tienes deudas registradas" : "No tienes préstamos dados registrados"}
          </p>
          <button onClick={() => setShowNewModal(true)} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium underline">
            Agregar uno
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active first, then paid */}
          {[...displayed.filter(l => l.status === "ACTIVE"), ...displayed.filter(l => l.status === "PAID")].map(loan => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onDelete={handleDelete}
              onPaymentAdded={handlePaymentAdded}
              onStatusToggled={handleStatusToggled}
            />
          ))}
        </div>
      )}

      {showNewModal && (
        <NewLoanModal onClose={() => setShowNewModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
