import { describe, expect, it } from "vitest";
import {
  MAX_AMOUNT_SATANG,
  formatCompactSatang,
  formatPercent,
  formatSatang,
  normalizeAmountInput,
  parseBahtToSatang,
  percentOf,
  satangToBahtString,
  savingsRate,
  sumSatang,
} from "@/lib/money";

describe("parseBahtToSatang", () => {
  it("converts baht strings to integer satang", () => {
    expect(parseBahtToSatang("1")).toBe(100);
    expect(parseBahtToSatang("12.3")).toBe(1230);
    expect(parseBahtToSatang("12.34")).toBe(1234);
    expect(parseBahtToSatang("0.01")).toBe(1);
    expect(parseBahtToSatang("1,234.50")).toBe(123450);
    expect(parseBahtToSatang("  ฿99.99 ")).toBe(9999);
  });

  it("rejects empty, zero, negative and malformed amounts", () => {
    for (const input of ["", " ", "0", "0.00", "-1", "1.234", "abc", "1,2.3.4", ".", "1e3"]) {
      expect(parseBahtToSatang(input), input).toBeNull();
    }
  });

  it("enforces the storage ceiling", () => {
    expect(parseBahtToSatang("999999999.99")).toBe(MAX_AMOUNT_SATANG);
    expect(parseBahtToSatang("1000000000")).toBeNull();
  });

  it("never returns a fractional satang value", () => {
    for (const input of ["0.1", "0.99", "1.01", "12345.67"]) {
      const satang = parseBahtToSatang(input);
      expect(Number.isInteger(satang)).toBe(true);
    }
  });
});

describe("amount input helpers", () => {
  it("keeps a single dot and at most two decimals", () => {
    expect(normalizeAmountInput("12..34")).toBe("12.34");
    expect(normalizeAmountInput("1a2b.3c4")).toBe("12.34");
    expect(normalizeAmountInput("1234567890")).toBe("123456789");
    expect(normalizeAmountInput("12.3456")).toBe("12.34");
  });

  it("formats satang back to a plain baht string", () => {
    expect(satangToBahtString(0)).toBe("0.00");
    expect(satangToBahtString(1)).toBe("0.01");
    expect(satangToBahtString(123450)).toBe("1234.50");
  });
});

describe("formatting and arithmetic", () => {
  it("formats integer satang without changing the value", () => {
    expect(formatSatang(123450, "en")).toContain("1,234.50");
    expect(formatSatang(123450, "en", { withDecimals: false })).toContain("1,235");
    expect(formatSatang(-500, "en")).toContain("5.00");
  });

  it("formats compact values for chart axes", () => {
    expect(formatCompactSatang(1_250_000, "en")).toBe("฿12.5k");
    expect(formatCompactSatang(250_000_000, "en")).toBe("฿2.5M");
  });

  it("sums satang exactly", () => {
    expect(sumSatang([1, 2, 3])).toBe(6);
    expect(sumSatang([10, 20, 30, 40])).toBe(100);
    expect(sumSatang([])).toBe(0);
  });

  it("clamps budget percentages", () => {
    expect(percentOf(50, 100)).toBe(50);
    expect(percentOf(150, 100)).toBe(100);
    expect(percentOf(10, 0)).toBe(0);
  });

  it("computes savings rate from integer satang", () => {
    expect(savingsRate(100_000, 40_000)).toBe(60);
    expect(savingsRate(0, 10)).toBeNull();
    expect(savingsRate(100, 150)).toBe(-50);
  });

  it("renders percentages with the right locale", () => {
    expect(formatPercent(18.4, "en")).toBe("18%");
    expect(formatPercent(100, "en")).toBe("100%");
  });
});
