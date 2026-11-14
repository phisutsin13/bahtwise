/**
 * All money in Bahtwise is stored as integer satang (1 THB = 100 satang).
 * No floating point arithmetic is ever used for storage or aggregation.
 */

export const SATANG_PER_BAHT = 100;
export const MAX_AMOUNT_SATANG = 99_999_999_999; // 999,999,999.99 THB

/** Parse a user-entered baht string into integer satang without floats. */
export function parseBahtToSatang(raw: string): number | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/[\s,]/g, "").replace(/^฿/, "").trim();
  if (!cleaned) return null;

  const match = /^(\d{0,9})(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!match) return null;

  const [, wholeRaw = "", fractionRaw = ""] = match;
  if (!wholeRaw && !fractionRaw) return null;

  const whole = Number.parseInt(wholeRaw || "0", 10);
  const fraction = Number.parseInt(fractionRaw.padEnd(2, "0") || "0", 10);
  if (!Number.isSafeInteger(whole) || !Number.isSafeInteger(fraction)) {
    return null;
  }

  const satang = whole * SATANG_PER_BAHT + fraction;
  if (!Number.isSafeInteger(satang) || satang <= 0) return null;
  if (satang > MAX_AMOUNT_SATANG) return null;
  return satang;
}

/** Convert a raw digit string from the amount keypad into display text. */
export function normalizeAmountInput(raw: string): string {
  let next = raw.replace(/[^\d.]/g, "");
  const firstDot = next.indexOf(".");
  if (firstDot !== -1) {
    next =
      next.slice(0, firstDot + 1) +
      next.slice(firstDot + 1).replace(/\./g, "");
  }
  const [whole, fraction] = next.split(".");
  const boundedWhole = whole.slice(0, 9);
  if (fraction === undefined) return boundedWhole;
  return `${boundedWhole}.${fraction.slice(0, 2)}`;
}

export function satangToBahtString(satang: number): string {
  const abs = Math.abs(Math.trunc(satang));
  const whole = Math.floor(abs / SATANG_PER_BAHT);
  const fraction = abs % SATANG_PER_BAHT;
  return `${whole}.${fraction.toString().padStart(2, "0")}`;
}

/** Format satang as a localized Thai baht currency string. */
export function formatSatang(
  satang: number,
  locale: "th" | "en" = "th",
  options: { withDecimals?: boolean; signDisplay?: "auto" | "always" | "never" } = {},
): string {
  const { withDecimals = true, signDisplay = "auto" } = options;
  const value = Math.trunc(satang) / SATANG_PER_BAHT;
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
    style: "currency",
    currency: "THB",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
    signDisplay,
  }).format(value);
}

/** Compact currency for chart axes, e.g. ฿12.5k or ฿1.2M. */
export function formatCompactSatang(
  satang: number,
  locale: "th" | "en" = "th",
): string {
  const baht = Math.trunc(satang) / SATANG_PER_BAHT;
  const abs = Math.abs(baht);
  const format = (value: number, maximumFractionDigits: number) =>
    new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
      maximumFractionDigits,
    }).format(value);

  if (abs >= 1_000_000) return `฿${format(baht / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `฿${format(baht / 1_000, 1)}k`;
  return `฿${format(baht, 0)}`;
}

export function sumSatang(values: number[]): number {
  return values.reduce((total, value) => total + Math.trunc(value), 0);
}

export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(100, Math.max(0, (part / whole) * 100));
}

export function savingsRate(income: number, expense: number): number | null {
  if (income <= 0) return null;
  return Math.round(((income - expense) / income) * 100);
}

export function formatPercent(value: number, locale: "th" | "en"): string {
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);
}
