/**
 * @module AccountFilterChips
 * Componente para filtrar transacciones por cuenta bancaria.
 */

"use client";

/**
 * Representa una cuenta para mostrar en los chips de filtro
 * @typedef {Object} AccountFilterChipItem
 * @property {string} id - ID único de la cuenta
 * @property {string} name - Nombre o apodo de la cuenta
 * @property {number} balance - Saldo en moneda (como en GET /api/accounts)
 */
export type AccountFilterChipItem = {
  id: string;
  name: string;
  /** Saldo en moneda (como en GET /api/accounts) */
  balance: number;
};

function applyWithViewTransition(update: () => void) {
  if (typeof document !== "undefined" && document.startViewTransition) {
    document.startViewTransition(update);
  } else {
    update();
  }
}

const defaultFormatBalance = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

/**
 * Props para el componente AccountFilterChips
 * @typedef {Object} AccountFilterChipsProps
 * @property {AccountFilterChipItem[]} accounts - Lista de cuentas a mostrar
 * @property {string} selectedAccountId - ID de la cuenta seleccionada actualmente (vacío = todas)
 * @property {(id: string) => void} onSelectAccountId - Callback cuando se selecciona una cuenta
 * @property {string} [allLabel="Todas"] - Etiqueta del chip "todas las cuentas"
 * @property {(amount: number) => string} [formatBalance] - Función para formatear el saldo
 * @property {string} [className] - Clases CSS adicionales
 */
export type AccountFilterChipsProps = {
  accounts: AccountFilterChipItem[];
  selectedAccountId: string;
  onSelectAccountId: (id: string) => void;
  /** Etiqueta del chip "todas las cuentas" */
  allLabel?: string;
  formatBalance?: (amount: number) => string;
  className?: string;
};

/**
 * Componente que muestra chips filtrable por cuenta bancaria.
 * Permite seleccionar una cuenta individual o ver todas las cuentas.
 * @param {AccountFilterChipsProps} props - Props del componente
 * @returns {React.ReactElement|null} El componente renderizado, o null si no hay cuentas
 * @example
 * <AccountFilterChips
 *   accounts={[{ id: "1", name: "Mi Cuenta", balance: 1000 }]}
 *   selectedAccountId=""
 *   onSelectAccountId={(id) => setSelected(id)}
 * />
 */
export function AccountFilterChips({
  accounts,
  selectedAccountId,
  onSelectAccountId,
  allLabel = "Todas",
  formatBalance = defaultFormatBalance,
  className = "",
}: AccountFilterChipsProps) {
  if (accounts.length === 0) return null;

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const chipBase =
    "flex flex-col items-start gap-0.5 px-3 py-2 rounded-2xl text-sm font-medium transition-colors border text-left";
  const chipSelected = "bg-indigo-600 text-white border-indigo-600 shadow-sm";
  const chipUnselected =
    "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600";

  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => applyWithViewTransition(() => onSelectAccountId(""))}
        className={`${chipBase} ${selectedAccountId === "" ? chipSelected : chipUnselected}`}
      >
        <span>{allLabel}</span>
        <span
          className={`text-xs font-normal tabular-nums ${
            selectedAccountId === "" ? "text-indigo-100" : "text-gray-500"
          }`}
        >
          {formatBalance(totalBalance)}
        </span>
      </button>
      {accounts.map((account) => (
        <button
          key={account.id}
          type="button"
          onClick={() => applyWithViewTransition(() => onSelectAccountId(account.id))}
          className={`${chipBase} ${selectedAccountId === account.id ? chipSelected : chipUnselected}`}
        >
          <span className="truncate max-w-[11rem]">{account.name}</span>
          <span
            className={`text-xs font-normal tabular-nums ${
              selectedAccountId === account.id ? "text-indigo-100" : "text-gray-500"
            }`}
          >
            {formatBalance(account.balance)}
          </span>
        </button>
      ))}
    </div>
  );
}
