import { BUILTIN_CATEGORIES } from "./categories";
import { addDays, addMonths, startOfMonth, todayISO } from "./date";
import type {
  Category,
  CategoryBudget,
  Locale,
  Profile,
  Transaction,
  TransactionKind,
} from "./types";

export const DEMO_USER_ID = "demo-user";

export type DemoSeed = {
  profile: Profile;
  categories: Category[];
  transactions: Transaction[];
  budgets: CategoryBudget[];
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function demoCategories(): Category[] {
  return BUILTIN_CATEGORIES.map((entry) => ({
    id: `demo-cat-${entry.slug}`,
    slug: entry.slug,
    name: entry.nameEn,
    icon: entry.icon,
    color: entry.color,
    kind: entry.kind,
  }));
}

const EXPENSE_NOTES: Record<string, { th: string; en: string; min: number; max: number; weight: number }[]> = {
  food: [
    { th: "ก๋วยเตี๋ยวเรือ", en: "Boat noodles", min: 6000, max: 12000, weight: 5 },
    { th: "กาแฟอารีย์", en: "Coffee at Ari", min: 6500, max: 13000, weight: 4 },
    { th: "ข้าวมันไก่", en: "Chicken rice", min: 7000, max: 11000, weight: 4 },
    { th: "มื้อเย็นกับเพื่อน", en: "Dinner with friends", min: 25000, max: 70000, weight: 2 },
    { th: "ตลาดนัด", en: "Street market", min: 5000, max: 20000, weight: 3 },
    { th: "ส้มตำ", en: "Som tam", min: 8000, max: 16000, weight: 2 },
    { th: "เดลิเวอรี", en: "Food delivery", min: 15000, max: 35000, weight: 3 },
  ],
  transport: [
    { th: "บีทีเอส", en: "BTS ride", min: 2500, max: 6200, weight: 5 },
    { th: "แกร็บ", en: "Grab ride", min: 9000, max: 28000, weight: 3 },
    { th: "น้ำมัน", en: "Fuel", min: 60000, max: 120000, weight: 1 },
    { th: "วินมอเตอร์ไซค์", en: "Motorbike taxi", min: 2000, max: 6000, weight: 2 },
    { th: "ที่จอดรถ", en: "Parking", min: 2000, max: 8000, weight: 1 },
  ],
  home: [
    { th: "ค่าหอพัก", en: "Apartment rent", min: 1150000, max: 1150000, weight: 1 },
    { th: "ของใช้ในบ้าน", en: "Home supplies", min: 15000, max: 55000, weight: 2 },
    { th: "ซ่อมแอร์", en: "Air-con repair", min: 150000, max: 280000, weight: 1 },
  ],
  shopping: [
    { th: "บิ๊กซี", en: "Big C groceries", min: 45000, max: 120000, weight: 3 },
    { th: "เสื้อยืดใหม่", en: "New t-shirt", min: 29000, max: 89000, weight: 2 },
    { th: "ของใช้สิ้นเดือน", en: "Monthly essentials", min: 35000, max: 90000, weight: 2 },
    { th: "หูฟัง", en: "Headphones", min: 79000, max: 240000, weight: 1 },
  ],
  health: [
    { th: "ร้านขายยา", en: "Pharmacy", min: 8000, max: 32000, weight: 2 },
    { th: "ฟิตเนส", en: "Gym membership", min: 89000, max: 150000, weight: 1 },
    { th: "ตรวจสุขภาพ", en: "Health check-up", min: 150000, max: 350000, weight: 1 },
  ],
  fun: [
    { th: "โรงหนัง", en: "Cinema", min: 18000, max: 35000, weight: 2 },
    { th: "คอนเสิร์ต", en: "Concert", min: 120000, max: 320000, weight: 1 },
    { th: "ร้านหนังสือ", en: "Bookstore", min: 15000, max: 65000, weight: 2 },
    { th: "คาเฟ่ริมแม่น้ำ", en: "Riverside cafe", min: 12000, max: 32000, weight: 2 },
    { th: "เน็ตฟลิกซ์", en: "Netflix", min: 16900, max: 16900, weight: 1 },
  ],
  bills: [
    { th: "ค่าไฟ", en: "Electricity", min: 90000, max: 190000, weight: 1 },
    { th: "ค่าเน็ตบ้าน", en: "Home internet", min: 59900, max: 59900, weight: 1 },
    { th: "ค่าโทรศัพท์", en: "Mobile plan", min: 39900, max: 69900, weight: 1 },
    { th: "ค่าน้ำ", en: "Water bill", min: 18000, max: 35000, weight: 1 },
  ],
  education: [
    { th: "คอร์สออนไลน์", en: "Online course", min: 99000, max: 290000, weight: 1 },
    { th: "หนังสือเรียน", en: "Textbook", min: 25000, max: 80000, weight: 1 },
  ],
  family: [
    { th: "โอนให้แม่", en: "Sent to mom", min: 300000, max: 500000, weight: 1 },
    { th: "ของขวัญวันเกิด", en: "Birthday gift", min: 80000, max: 180000, weight: 1 },
  ],
  "other-expense": [
    { th: "ค่าธรรมเนียม", en: "Bank fee", min: 1500, max: 5000, weight: 1 },
    { th: "บริจาค", en: "Donation", min: 20000, max: 100000, weight: 1 },
  ],
};

const INCOME_NOTES: Record<string, { th: string; en: string; min: number; max: number; weight: number }[]> = {
  freelance: [
    { th: "งานออกแบบเว็บ", en: "Web design project", min: 450000, max: 1200000, weight: 1 },
    { th: "งานเขียนคอนเทนต์", en: "Content writing", min: 180000, max: 380000, weight: 1 },
  ],
  business: [
    { th: "ขายออนไลน์", en: "Online shop sales", min: 180000, max: 550000, weight: 1 },
  ],
  investment: [
    { th: "เงินปันผล", en: "Dividend", min: 45000, max: 180000, weight: 1 },
    { th: "ขายหุ้น", en: "Investment gain", min: 120000, max: 500000, weight: 1 },
  ],
  gift: [
    { th: "ของขวัญจากครอบครัว", en: "Gift from family", min: 100000, max: 300000, weight: 1 },
  ],
};

function weightedPick<T extends { weight: number }>(items: T[], random: number): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
}

function roundSatang(value: number): number {
  // Demo amounts are already whole satang; keep values off the .00 grid
  // occasionally so formatting feels real.
  return Math.round(value / 100) * 100 + (Math.floor(value / 100) % 3 === 0 ? 50 : 0);
}

export function createDemoSeed(locale: Locale, today = todayISO()): DemoSeed {
  const categories = demoCategories();
  const categoryBySlug = new Map(categories.map((entry) => [entry.slug, entry]));
  const transactions: Transaction[] = [];
  const todayDate = new Date(`${today}T12:00:00`);
  const start = addDays(today, -365);
  let cursor = start;
  let dayNumber = 0;

  while (cursor <= today) {
    dayNumber += 1;
    const random = mulberry32(hashString(`${cursor}:my-money-demo`));
    const date = new Date(`${cursor}T09:00:00`);
    const dom = date.getDate();
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    let index = 0;

    const push = (
      kind: TransactionKind,
      amount: number,
      slug: string,
      note: string,
      hour: number,
    ) => {
      const category = categoryBySlug.get(slug);
      if (!category) return;
      index += 1;
      transactions.push({
        id: `demo-tx-${cursor}-${index}`,
        kind,
        amountSatang: Math.max(100, Math.round(amount)),
        categoryId: category.id,
        note,
        occurredOn: cursor,
        createdAt: `${cursor}T${`${hour}`.padStart(2, "0")}:${`${(index * 13) % 60}`.padStart(2, "0")}:00.000Z`,
      });
    };

    // Salary on the 1st, rent on the 3rd, utilities around the 5th.
    if (dom === 1) {
      push("income", 48_500_00, "salary", locale === "th" ? "เงินเดือน" : "Monthly salary", 9);
    }
    if (dom === 3) {
      const rent = EXPENSE_NOTES.home[0];
      push("expense", 11_500_00, "home", locale === "th" ? rent.th : rent.en, 10);
    }
    if (dom === 5) {
      const bill = EXPENSE_NOTES.bills[0];
      push("expense", roundSatang(bill.min + random() * (bill.max - bill.min)), "bills", locale === "th" ? bill.th : bill.en, 11);
      push("expense", EXPENSE_NOTES.bills[1].min, "bills", locale === "th" ? EXPENSE_NOTES.bills[1].th : EXPENSE_NOTES.bills[1].en, 11);
    }
    if (dom === 15 || (dom === 24 && random() > 0.5)) {
      const freelance = weightedPick(INCOME_NOTES.freelance, random());
      push(
        "income",
        roundSatang(freelance.min + random() * (freelance.max - freelance.min)),
        "freelance",
        locale === "th" ? freelance.th : freelance.en,
        15,
      );
    }
    if (dom === 18 && random() > 0.45) {
      const investment = INCOME_NOTES.investment[0];
      push("income", roundSatang(investment.min + random() * (investment.max - investment.min)), "investment", locale === "th" ? investment.th : investment.en, 14);
    }

    const mealCount = random() > 0.18 ? (random() > 0.72 ? 2 : 1) : 0;
    for (let meal = 0; meal < mealCount; meal += 1) {
      if (dom === 3) break;
      const food = weightedPick(EXPENSE_NOTES.food, random());
      push(
        "expense",
        roundSatang(food.min + random() * (food.max - food.min)),
        "food",
        locale === "th" ? food.th : food.en,
        8 + meal * 5,
      );
    }

    if (dom !== 3 && random() > 0.32) {
      const transport = weightedPick(EXPENSE_NOTES.transport, random());
      push(
        "expense",
        roundSatang(transport.min + random() * (transport.max - transport.min)),
        "transport",
        locale === "th" ? transport.th : transport.en,
        7,
      );
    }

    if (random() > 0.74) {
      const shopping = weightedPick(EXPENSE_NOTES.shopping, random());
      push(
        "expense",
        roundSatang(shopping.min + random() * (shopping.max - shopping.min)),
        "shopping",
        locale === "th" ? shopping.th : shopping.en,
        17,
      );
    }

    if (isWeekend && random() > 0.4) {
      const fun = weightedPick(EXPENSE_NOTES.fun, random());
      push(
        "expense",
        roundSatang(fun.min + random() * (fun.max - fun.min)),
        "fun",
        locale === "th" ? fun.th : fun.en,
        18,
      );
    }

    if (dom === 12 && random() > 0.55) {
      const health = weightedPick(EXPENSE_NOTES.health, random());
      push(
        "expense",
        roundSatang(health.min + random() * (health.max - health.min)),
        "health",
        locale === "th" ? health.th : health.en,
        12,
      );
    }
    if (dom === 22 && random() > 0.6) {
      const family = EXPENSE_NOTES.family[0];
      push("expense", roundSatang(family.min + random() * (family.max - family.min)), "family", locale === "th" ? family.th : family.en, 19);
    }
    if (dom === 28 && random() > 0.86) {
      const other = EXPENSE_NOTES["other-expense"][1];
      push("expense", roundSatang(other.min + random() * (other.max - other.min)), "other-expense", locale === "th" ? other.th : other.en, 20);
    }

    cursor = addDays(cursor, 1);
    if (dayNumber > 400) break;
  }

  const budgets: CategoryBudget[] = [];
  const currentMonth = startOfMonth(today);
  const limits: Record<string, number> = {
    food: 9_000_00,
    transport: 2_500_00,
    shopping: 5_000_00,
    fun: 3_000_00,
    bills: 4_500_00,
  };
  for (let offset = 0; offset < 6; offset += 1) {
    const month = startOfMonth(addMonths(currentMonth, -offset));
    for (const [slug, amount] of Object.entries(limits)) {
      const category = categoryBySlug.get(slug);
      if (!category) continue;
      budgets.push({
        id: `demo-budget-${month}-${slug}`,
        categoryId: category.id,
        month,
        amountSatang: amount,
      });
    }
  }

  return {
    profile: {
      id: DEMO_USER_ID,
      username: "nara",
      displayName: locale === "th" ? "นารา" : "Nara",
      email: "nara@example.com",
      monthlyBudgetSatang: 28_000_00,
      locale,
      createdAt: todayDate.toISOString(),
    },
    categories,
    transactions,
    budgets,
  };
}
