const localeMap: Record<string, string> = {
  RON: "ro-RO",
  EUR: "de-DE",
  USD: "en-US",
  GBP: "en-GB",
};

export function formatCurrency(amount: number, currency: string): string {
  const locale = localeMap[currency] || "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export const SUPPORTED_CURRENCIES = ["RON", "EUR", "USD", "GBP"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
