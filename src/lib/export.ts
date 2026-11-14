import { categoryLabel } from "./categories";
import { formatDay } from "./date";
import type { Category, Locale, Transaction } from "./types";

export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildTransactionsCsv(
  transactions: Transaction[],
  categories: Category[],
  locale: Locale,
): string {
  const header =
    locale === "th"
      ? "วันที่,ประเภท,หมวดหมู่,บันทึก,จำนวน (บาท),จำนวน (สตางค์)"
      : "Date,Type,Category,Note,Amount (THB),Amount (satang)";
  const kindLabel = (kind: Transaction["kind"]) =>
    locale === "th"
      ? kind === "income"
        ? "รายรับ"
        : "รายจ่าย"
      : kind === "income"
        ? "Income"
        : "Expense";

  const rows = [...transactions]
    .sort((a, b) => (a.occurredOn < b.occurredOn ? 1 : -1))
    .map((transaction) => {
      const category = categories.find((entry) => entry.id === transaction.categoryId) ?? null;
      const baht = (transaction.amountSatang / 100).toFixed(2);
      return [
        transaction.occurredOn,
        kindLabel(transaction.kind),
        categoryLabel(category, locale),
        transaction.note,
        baht,
        String(transaction.amountSatang),
      ]
        .map((value) => csvEscape(String(value)))
        .join(",");
    });

  // BOM keeps Thai text readable in Excel.
  return `\uFEFF${[header, ...rows].join("\r\n")}\r\n`;
}

export function buildTransactionsJson(
  transactions: Transaction[],
  categories: Category[],
  budgets: unknown,
  profile: unknown,
): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      categories,
      transactions,
      budgets,
    },
    null,
    2,
  );
}

export function downloadFile(
  contents: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportFilename(base: string, extension: string): string {
  const date = formatDay(new Date().toISOString().slice(0, 10), "en", "short")
    .replace(/[^\w]+/g, "-")
    .replace(/-+/g, "-");
  return `${base}-${date}.${extension}`;
}
