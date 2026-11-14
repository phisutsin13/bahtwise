type LogValue = string | number | boolean | null | undefined | LogValue[] | { [key: string]: LogValue };

const SENSITIVE_KEYS = new Set([
  "id",
  "user_id",
  "userId",
  "email",
  "username",
  "display_name",
  "displayName",
  "note",
  "password",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "cookie",
  "amount",
  "amountSatang",
  "amount_satang",
  "name",
  "budget",
]);

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const LONG_NUMBER_RE = /\b\d{9,}\b/g;

/** Strip values that could identify a person before anything reaches a log. */
export function sanitizeForLog(value: unknown, depth = 0): LogValue {
  if (depth > 4) return "[depth]";
  if (value === null || value === undefined) return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value
      .replace(EMAIL_RE, "[email]")
      .replace(UUID_RE, "[uuid]")
      .replace(LONG_NUMBER_RE, "[number]")
      .slice(0, 300);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 12).map((entry) => sanitizeForLog(entry, depth + 1));
  }
  if (typeof value === "object") {
    const result: Record<string, LogValue> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SENSITIVE_KEYS.has(key)
        ? "[redacted]"
        : sanitizeForLog(entry, depth + 1);
    }
    return result;
  }
  return "[unserializable]";
}

/**
 * Development-only logger. It is compiled out of production behaviour and
 * redacts identifiers, personal text and amounts before writing.
 */
export function debugLog(event: string, data?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof console === "undefined") return;
  const payload = data ? sanitizeForLog(data) : undefined;
  console.debug(`[bahtwise] ${event}`, payload ?? "");
}

export function debugError(event: string, error: unknown): void {
  if (process.env.NODE_ENV !== "development") return;
  const safe =
    error instanceof Error
      ? sanitizeForLog({ errorName: error.name, code: (error as { code?: string }).code })
      : sanitizeForLog(error);
  console.debug(`[bahtwise] ${event}`, safe);
}
