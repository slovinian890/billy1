import type { Currency } from "@/types";

const SYMBOLS: Record<Currency, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
};

/**
 * Formats integer cents as a money string, e.g. `formatMoney(450) -> "€4.50"`.
 * Never pass floating point cents in — money is always an integer.
 */
export function formatMoney(cents: number, currency: Currency = "EUR"): string {
  const symbol = SYMBOLS[currency];
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const amount = (abs / 100).toFixed(2);
  return `${negative ? "-" : ""}${symbol}${amount}`;
}
