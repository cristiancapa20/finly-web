"use client";

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
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

type AccountFilterChipsProps = {
  accounts: AccountFilterChipItem[];
  selectedAccountId: string;
  onSelectAccountId: (id: string) => void;
  /** Etiqueta del chip “todas las cuentas” */
  allLabel?: string;
  formatBalance?: (amount: number) => string;
  className?: string;
};

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
