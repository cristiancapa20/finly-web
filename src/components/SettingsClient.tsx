"use client";

import { useState, useEffect, useCallback } from "react";
import Skeleton from "react-loading-skeleton";
import { Trash2, Wallet, Building2, CreditCard, CircleDollarSign, Pencil, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { getCategoryIcon } from "@/lib/categoryIcons";
import type { LucideIcon } from "lucide-react";

type AccountType = "CASH" | "BANK" | "CREDIT_CARD" | "OTHER";

interface Account {
  id: string;
  name: string;
  type: AccountType;
  color?: string;
  balance?: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
  isSystem: boolean;
  _count?: { transactions: number };
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Efectivo",
  BANK: "Ahorro",
  CREDIT_CARD: "Crédito",
  OTHER: "Corriente",
};

const ACCOUNT_TYPE_STYLES: Record<AccountType, { Icon: LucideIcon; color: string; bg: string }> = {
  CASH:        { Icon: Wallet,           color: "#10b981", bg: "#10b98122" },
  BANK:        { Icon: Building2,        color: "#3b82f6", bg: "#3b82f622" },
  CREDIT_CARD: { Icon: CreditCard,       color: "#8b5cf6", bg: "#8b5cf622" },
  OTHER:       { Icon: CircleDollarSign, color: "#f59e0b", bg: "#f59e0b22" },
};

const CARD_COLORS = [
  "#1e3a5f", "#0f766e", "#7c3aed", "#be185d", "#b45309",
  "#1d4ed8", "#065f46", "#831843", "#1e40af", "#374151",
];

const PRESET_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#F0A500", "#6C5CE7", "#A29BFE", "#B2BEC3",
  "#FD79A8", "#00B894", "#E17055", "#0984E3", "#FDCB6E",
];

export default function SettingsClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Account modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<AccountType>("CASH");
  const [newAccountColor, setNewAccountColor] = useState("#1e3a5f");
  const [newAccountBalance, setNewAccountBalance] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");

  // Edit account state
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editColor, setEditColor] = useState("#1e3a5f");
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0]);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categoryTab, setCategoryTab] = useState<"system" | "custom">("system");

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetch("/api/accounts");
      const json = await res.json();
      setAccounts(json.data ?? []);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      setCategories(json.data ?? []);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, [fetchAccounts, fetchCategories]);

  function openCreateModal() {
    setNewAccountName("");
    setNewAccountType("CASH");
    setNewAccountColor("#1e3a5f");
    setNewAccountBalance("");
    setAccountError("");
    setCreateStep(1);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    setCreateStep(1);
    setAccountError("");
  }

  async function handleCreateAccount() {
    setAccountError("");
    setSavingAccount(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAccountName, type: newAccountType, color: newAccountColor, initialBalance: parseFloat(newAccountBalance) }),
      });
      if (!res.ok) {
        const json = await res.json();
        setAccountError(json.error ?? "Error al crear cuenta");
        return;
      }
      closeCreateModal();
      await fetchAccounts();
      toast.success({ title: "Cuenta creada exitosamente" });
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleDeleteAccount(id: string) {
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      toast.error({ title: json.error ?? "Error al eliminar cuenta" });
      return;
    }
    await fetchAccounts();
    toast.success({ title: "Cuenta eliminada" });
  }

  function openEditAccount(account: Account) {
    setEditingAccount(account);
    setEditColor(account.color ?? "#1e3a5f");
    setEditName(account.name);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAccount) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, color: editColor }),
      });
      if (res.ok) {
        setEditingAccount(null);
        await fetchAccounts();
        toast.success({ title: "Cuenta actualizada" });
      }
    } finally {
      setSavingEdit(false);
    }
  }

  function openCategoryModal() {
    setNewCategoryName("");
    setNewCategoryColor(PRESET_COLORS[0]);
    setCategoryError("");
    setShowCategoryModal(true);
  }

  function closeCategoryModal() {
    setShowCategoryModal(false);
    setCategoryError("");
  }

  async function handleCreateCategory() {
    setCategoryError("");
    setSavingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
      });
      if (!res.ok) {
        const json = await res.json();
        setCategoryError(json.error ?? "Error al crear categoría");
        return;
      }
      closeCategoryModal();
      await fetchCategories();
      toast.success({ title: "Categoría creada exitosamente" });
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      toast.error({ title: json.error ?? "Error al eliminar categoría" });
      return;
    }
    await fetchCategories();
    toast.success({ title: "Categoría eliminada" });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Accounts Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Cuentas</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Nueva cuenta
          </button>
        </div>

        {/* Account list as cards */}
        {loadingAccounts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden h-36 p-5 flex flex-col justify-between bg-gray-100">
                <Skeleton width="40%" height={12} />
                <div>
                  <Skeleton width="60%" height={16} className="mb-1" />
                  <Skeleton width="40%" height={12} />
                </div>
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">No hay cuentas</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {accounts.map((account) => {
              const { Icon } = ACCOUNT_TYPE_STYLES[account.type];
              return (
                <div
                  key={account.id}
                  className="relative rounded-2xl overflow-hidden h-36 p-5 flex flex-col justify-between select-none shadow-md"
                  style={{ background: `linear-gradient(135deg, ${account.color ?? "#1e3a5f"}ee, ${account.color ?? "#1e3a5f"}99)` }}
                >
                  {/* Background decoration */}
                  <div
                    className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-20"
                    style={{ backgroundColor: "#ffffff" }}
                  />
                  <div
                    className="absolute -right-2 top-10 w-16 h-16 rounded-full opacity-10"
                    style={{ backgroundColor: "#ffffff" }}
                  />

                  {/* Top row: tipo + acciones */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-white/50 text-[10px] uppercase tracking-widest leading-none mb-0.5">Tipo</p>
                        <p className="text-white/90 text-xs font-medium leading-none">{ACCOUNT_TYPE_LABELS[account.type]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditAccount(account)}
                        title="Editar cuenta"
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#F0A50033" }}
                      >
                        <Pencil className="w-3.5 h-3.5" style={{ color: "#F0A500" }} />
                      </button>
                      <DeleteButton
                        onDelete={() => handleDeleteAccount(account.id)}
                        label="Eliminar cuenta"
                        light
                      />
                    </div>
                  </div>

                  {/* Bottom: nombre + saldo */}
                  <div className="relative z-10">
                    <p className="text-white/50 text-[10px] uppercase tracking-widest leading-none mb-1">Nombre</p>
                    <div className="flex items-end justify-between gap-2">
                      <p className="text-white font-semibold text-base leading-tight truncate">{account.name}</p>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white/50 text-[10px] uppercase tracking-widest leading-none mb-0.5">Saldo</p>
                        <p className="text-white font-bold text-sm leading-tight">
                          {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(account.balance ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* Categories Section */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-800">Categorías</h2>
          <button
            onClick={openCategoryModal}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Nueva categoría
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Las categorías iniciales vienen preinstaladas. Puedes crear las tuyas propias.</p>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => {
              if (document.startViewTransition) {
                document.startViewTransition(() => setCategoryTab("system"));
              } else {
                setCategoryTab("system");
              }
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5 ${
              categoryTab === "system"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
            }`}
          >
            Iniciales
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${categoryTab === "system" ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500"}`}>
              {categories.filter(c => c.isSystem).length}
            </span>
          </button>
          <button
            onClick={() => {
              if (document.startViewTransition) {
                document.startViewTransition(() => setCategoryTab("custom"));
              } else {
                setCategoryTab("custom");
              }
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5 ${
              categoryTab === "custom"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
            }`}
          >
            Mis categorías
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${categoryTab === "custom" ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500"}`}>
              {categories.filter(c => !c.isSystem).length}
            </span>
          </button>
        </div>

        {/* Category list */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
          {loadingCategories ? (
            <ul className="divide-y divide-gray-100">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton circle width={28} height={28} />
                  <Skeleton width={100} height={14} />
                </li>
              ))}
            </ul>
          ) : categories.filter((c) => categoryTab === "system" ? c.isSystem : !c.isSystem).length === 0 ? (
            <p className="text-sm text-gray-500 p-4">
              {categoryTab === "custom" ? "Aún no has creado categorías propias" : "No hay categorías iniciales"}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {categories.filter((c) => categoryTab === "system" ? c.isSystem : !c.isSystem).map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getCategoryIcon(category.name);
                      return (
                        <span
                          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: category.color + "22" }}
                        >
                          <Icon className="w-4 h-4" style={{ color: category.color }} />
                        </span>
                      );
                    })()}
                    <p className="text-sm font-medium text-gray-800">{category.name}</p>
                    {category.isSystem && (
                      <span className="inline-block bg-indigo-50 text-indigo-500 text-xs px-2 py-0.5 rounded-full">
                        Inicial
                      </span>
                    )}
                  </div>
                  {!category.isSystem && (
                    <DeleteButton
                      onDelete={() => handleDeleteCategory(category.id)}
                      label="Eliminar categoría"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

      </section>
      {/* Create Account Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeCreateModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Nueva cuenta</h3>
              <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${createStep === 1 ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-600"}`}>1</div>
                <span className={`text-xs font-medium ${createStep === 1 ? "text-indigo-600" : "text-gray-400"}`}>Información</span>
              </div>
              <div className="w-8 h-px bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${createStep === 2 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"}`}>2</div>
                <span className={`text-xs font-medium ${createStep === 2 ? "text-indigo-600" : "text-gray-400"}`}>Saldo</span>
              </div>
            </div>

            {/* Step 1 */}
            {createStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Nombre o apodo <span className="text-gray-400">(para identificarla)</span>
                  </label>
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    autoFocus
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Ej: Pichincha, Mi tarjeta de crédito, Cartera..."
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Puede ser el nombre del banco o un apodo personalizado.</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Tipo de cuenta
                  </label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as AccountType)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">Selecciona el tipo: ahorro, corriente, crédito o efectivo.</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Color de la tarjeta</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {CARD_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewAccountColor(color)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${newAccountColor === color ? "border-gray-800 scale-110" : "border-transparent hover:scale-105"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">O elige:</span>
                    <input
                      type="color"
                      value={newAccountColor}
                      onChange={(e) => setNewAccountColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                    />
                    <span className="inline-block w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: newAccountColor }} />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!newAccountName.trim()}
                  onClick={() => setCreateStep(2)}
                  className="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                >
                  Siguiente
                  <span>→</span>
                </button>
              </div>
            )}

            {/* Step 2 */}
            {createStep === 2 && (
              <div className="space-y-4">
                {/* Preview card */}
                <div
                  className="relative rounded-xl overflow-hidden h-20 px-4 py-3 flex flex-col justify-between"
                  style={{ background: `linear-gradient(135deg, ${newAccountColor}ee, ${newAccountColor}99)` }}
                >
                  <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/20" />
                  {(() => { const { Icon } = ACCOUNT_TYPE_STYLES[newAccountType]; return (
                    <div className="flex items-center gap-1.5 relative z-10">
                      <Icon className="w-3.5 h-3.5 text-white/80" />
                      <span className="text-white/70 text-xs uppercase tracking-wide">{ACCOUNT_TYPE_LABELS[newAccountType]}</span>
                    </div>
                  ); })()}
                  <p className="text-white font-semibold text-sm relative z-10 truncate">{newAccountName}</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Saldo inicial <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newAccountBalance}
                    onChange={(e) => setNewAccountBalance(e.target.value)}
                    autoFocus
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="0.00"
                  />
                </div>

                {accountError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{accountError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateStep(1)}
                    className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    ← Atrás
                  </button>
                  <button
                    type="button"
                    disabled={savingAccount || newAccountBalance === ""}
                    onClick={handleCreateAccount}
                    className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {savingAccount ? "Creando..." : "Crear cuenta"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeCategoryModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800">Nueva categoría</h3>
              <button onClick={closeCategoryModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Ej: Gimnasio, Suscripciones..."
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2">Color</label>
                {/* Preview */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-8 h-8 rounded-full border-2 border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: newCategoryColor }}
                  />
                  <span className="text-sm text-gray-600 truncate">{newCategoryName || "Vista previa"}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        newCategoryColor === color ? "border-gray-800 scale-110" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">O elige:</span>
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                  />
                </div>
              </div>

              {categoryError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{categoryError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingCategory || !newCategoryName.trim()}
                  onClick={handleCreateCategory}
                  className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {savingCategory ? "Creando..." : "Crear categoría"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800">Editar cuenta</h3>
              <button
                onClick={() => setEditingAccount(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview card */}
            <div
              className="relative rounded-xl overflow-hidden h-24 p-4 mb-5 flex flex-col justify-between"
              style={{ background: `linear-gradient(135deg, ${editColor}ee, ${editColor}99)` }}
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/20" />
              <div className="flex items-center gap-2 relative z-10">
                {(() => { const { Icon } = ACCOUNT_TYPE_STYLES[editingAccount.type]; return <Icon className="w-4 h-4 text-white/80" />; })()}
                <span className="text-white/70 text-xs uppercase tracking-wide">{ACCOUNT_TYPE_LABELS[editingAccount.type]}</span>
              </div>
              <p className="text-white font-semibold text-base relative z-10 truncate">{editName || editingAccount.name}</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">Color</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {CARD_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        editColor === color ? "border-gray-800 scale-110" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">O elige:</span>
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {savingEdit ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteButton({ onDelete, label, light }: { onDelete: () => void; label: string; light?: boolean }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={onDelete}
          className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors"
        >
          Confirmar
        </button>
        <button
          onClick={() => setConfirming(false)}
          className={`text-xs px-2 py-1 rounded transition-colors ${light ? "text-white/70 hover:text-white" : "text-gray-500 hover:text-gray-700"}`}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label={label}
      className="w-7 h-7 rounded-full flex items-center justify-center"
      style={{ backgroundColor: "#ef444433" }}
    >
      <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
    </button>
  );
}
