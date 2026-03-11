export function amountInputToCents(amount: number | string) {
  const parsed = typeof amount === "number" ? amount : Number.parseFloat(amount);

  if (Number.isNaN(parsed)) {
    return Number.NaN;
  }

  return Math.round(parsed * 100);
}

export function centsToAmount(cents: number) {
  return cents / 100;
}
