import type { Category, CategoryColor, TransactionKind } from "./types";

export type BuiltinCategory = {
  slug: string;
  icon: string;
  color: CategoryColor;
  kind: TransactionKind;
  nameEn: string;
  nameTh: string;
};

export const BUILTIN_CATEGORIES: BuiltinCategory[] = [
  { slug: "food", icon: "🍜", color: "coral", kind: "expense", nameEn: "Food & drinks", nameTh: "อาหารและเครื่องดื่ม" },
  { slug: "transport", icon: "🚇", color: "sky", kind: "expense", nameEn: "Transport", nameTh: "การเดินทาง" },
  { slug: "home", icon: "🏠", color: "amber", kind: "expense", nameEn: "Home", nameTh: "ที่อยู่อาศัย" },
  { slug: "shopping", icon: "🛍️", color: "violet", kind: "expense", nameEn: "Shopping", nameTh: "ช้อปปิ้ง" },
  { slug: "health", icon: "💊", color: "rose", kind: "expense", nameEn: "Health", nameTh: "สุขภาพ" },
  { slug: "fun", icon: "🎬", color: "lime", kind: "expense", nameEn: "Fun & leisure", nameTh: "บันเทิงและพักผ่อน" },
  { slug: "bills", icon: "🧾", color: "slate", kind: "expense", nameEn: "Bills & utilities", nameTh: "บิลและค่าสาธารณูปโภค" },
  { slug: "education", icon: "📚", color: "emerald", kind: "expense", nameEn: "Education", nameTh: "การศึกษา" },
  { slug: "family", icon: "👨‍👩‍👧", color: "rose", kind: "expense", nameEn: "Family", nameTh: "ครอบครัว" },
  { slug: "other-expense", icon: "✨", color: "slate", kind: "expense", nameEn: "Other", nameTh: "อื่น ๆ" },
  { slug: "salary", icon: "💼", color: "emerald", kind: "income", nameEn: "Salary", nameTh: "เงินเดือน" },
  { slug: "freelance", icon: "💻", color: "sky", kind: "income", nameEn: "Freelance", nameTh: "งานฟรีแลนซ์" },
  { slug: "business", icon: "🏪", color: "amber", kind: "income", nameEn: "Business", nameTh: "ธุรกิจ" },
  { slug: "investment", icon: "📈", color: "lime", kind: "income", nameEn: "Investment", nameTh: "การลงทุน" },
  { slug: "gift", icon: "🎁", color: "violet", kind: "income", nameEn: "Gifts", nameTh: "ของขวัญ" },
  { slug: "other-income", icon: "✨", color: "slate", kind: "income", nameEn: "Other", nameTh: "อื่น ๆ" },
];

export const CATEGORY_COLORS: Record<CategoryColor, { light: string; dark: string; soft: string }> = {
  emerald: { light: "#0F7B5A", dark: "#5FD6A6", soft: "rgba(15,123,90,0.12)" },
  coral: { light: "#D95F45", dark: "#FF8C72", soft: "rgba(217,95,69,0.12)" },
  amber: { light: "#B97A17", dark: "#F0B95C", soft: "rgba(185,122,23,0.13)" },
  sky: { light: "#2B6E91", dark: "#74BCE0", soft: "rgba(43,110,145,0.12)" },
  violet: { light: "#7757A8", dark: "#B99BE8", soft: "rgba(119,87,168,0.12)" },
  rose: { light: "#B24A6B", dark: "#F28CAE", soft: "rgba(178,74,107,0.12)" },
  lime: { light: "#5B7A12", dark: "#C3E464", soft: "rgba(91,122,18,0.13)" },
  slate: { light: "#5A6560", dark: "#A5B3AC", soft: "rgba(90,101,96,0.12)" },
};

export function categoryLabel(
  category: Category | null | undefined,
  locale: "th" | "en",
): string {
  if (!category) return locale === "th" ? "ไม่มีหมวดหมู่" : "Uncategorized";
  if (!category.slug) return category.name;
  const builtin = BUILTIN_CATEGORIES.find((entry) => entry.slug === category.slug);
  if (!builtin) return category.name;
  return locale === "th" ? builtin.nameTh : builtin.nameEn;
}

export function builtinCategoryMeta(slug: string): BuiltinCategory | undefined {
  return BUILTIN_CATEGORIES.find((entry) => entry.slug === slug);
}

export function categoryColorValue(
  color: CategoryColor,
  mode: "light" | "dark",
): string {
  return CATEGORY_COLORS[color][mode];
}

export function categorySoftColor(color: CategoryColor): string {
  return CATEGORY_COLORS[color].soft;
}
