import type { Locale } from "./types";

/** Local-time ISO date (YYYY-MM-DD), avoiding UTC off-by-one errors. */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function addMonths(iso: string, months: number): string {
  const date = parseISODate(iso);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toISODate(date);
}

/** Monday-based start of week. */
export function startOfWeek(iso: string): string {
  const date = parseISODate(iso);
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return toISODate(date);
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(iso: string): string {
  const date = parseISODate(iso);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return toISODate(last);
}

export function startOfYear(iso: string): string {
  return `${iso.slice(0, 4)}-01-01`;
}

export function endOfYear(iso: string): string {
  return `${iso.slice(0, 4)}-12-31`;
}

export function daysBetween(startISO: string, endISO: string): number {
  const start = Date.UTC(
    Number(startISO.slice(0, 4)),
    Number(startISO.slice(5, 7)) - 1,
    Number(startISO.slice(8, 10)),
  );
  const end = Date.UTC(
    Number(endISO.slice(0, 4)),
    Number(endISO.slice(5, 7)) - 1,
    Number(endISO.slice(8, 10)),
  );
  return Math.round((end - start) / 86_400_000);
}

export function eachDay(startISO: string, endISO: string): string[] {
  const days: string[] = [];
  let cursor = startISO;
  let guard = 0;
  while (cursor <= endISO && guard < 1000) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return days;
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function monthKey(iso: string): string {
  return startOfMonth(iso);
}

export function formatDay(
  iso: string,
  locale: Locale,
  variant: "short" | "long" | "weekday" | "monthShort" = "short",
): string {
  const intlLocale = locale === "th" ? "th-TH-u-ca-gregory" : "en-US";
  const date = parseISODate(iso);
  if (variant === "weekday") {
    return new Intl.DateTimeFormat(intlLocale, { weekday: "short" }).format(date);
  }
  if (variant === "monthShort") {
    return new Intl.DateTimeFormat(intlLocale, {
      month: "short",
      year: "numeric",
    }).format(date);
  }
  return new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: variant === "long" ? "long" : "short",
    year: "numeric",
  }).format(date);
}

export function formatMonth(monthISO: string, locale: Locale): string {
  const intlLocale = locale === "th" ? "th-TH-u-ca-gregory" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    month: "long",
    year: "numeric",
  }).format(parseISODate(monthISO));
}

export function formatWeekRange(startISO: string, locale: Locale): string {
  const endISO = addDays(startISO, 6);
  const intlLocale = locale === "th" ? "th-TH-u-ca-gregory" : "en-US";
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  const sameMonth = startISO.slice(0, 7) === endISO.slice(0, 7);
  const startText = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: sameMonth ? undefined : "short",
  }).format(start);
  const endText = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end);
  return `${startText} – ${endText}`;
}

export function formatRelativeDay(
  iso: string,
  locale: Locale,
  today = todayISO(),
): string {
  if (iso === today) {
    return locale === "th" ? "วันนี้" : "Today";
  }
  if (iso === addDays(today, -1)) {
    return locale === "th" ? "เมื่อวาน" : "Yesterday";
  }
  return formatDay(iso, locale, "long");
}

export function timeAgo(isoDateTime: string, locale: Locale): string {
  const then = new Date(isoDateTime).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMinutes = Math.max(0, Math.floor((Date.now() - then) / 60_000));
  const rtf = new Intl.RelativeTimeFormat(locale === "th" ? "th" : "en", {
    numeric: "auto",
  });
  if (diffMinutes < 1) return rtf.format(0, "second");
  if (diffMinutes < 60) return rtf.format(-diffMinutes, "minute");
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
}
