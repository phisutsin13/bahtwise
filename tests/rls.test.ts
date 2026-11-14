import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATION = readFileSync(
  fileURLToPath(new URL("../supabase/migrations/20260101000000_init.sql", import.meta.url)),
  "utf8",
);

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";

let db: PGlite;

async function setUser(id: string | null) {
  await db.exec(`reset role`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [id ?? ""]);
  if (id) await db.exec(`set role authenticated`);
}

async function asAlice<T>(fn: () => Promise<T>): Promise<T> {
  await setUser(ALICE);
  return fn();
}

async function asBob<T>(fn: () => Promise<T>): Promise<T> {
  await setUser(BOB);
  return fn();
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create schema auth;
    create table auth.users (
      id uuid primary key,
      email text,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create function auth.uid() returns uuid
      language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create role authenticated nologin;
  `);
  await db.exec(MIGRATION);
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, 'alice@example.com', '{"username":"alice","display_name":"Alice"}'),
       ($2, 'bob@example.com', '{"username":"bob","display_name":"Bob"}')`,
    [ALICE, BOB],
  );
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("SQL migration", () => {
  it("creates a profile for every new auth user", async () => {
    const { rows } = await db.query<{ id: string; username: string }>(
      `select id, username from public.profiles order by username`,
    );
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.username)).toEqual(["alice", "bob"]);
  });

  it("seeds the built-in categories once", async () => {
    const { rows } = await db.query<{ count: number }>(
      `select count(*)::int as count from public.categories where user_id is null`,
    );
    expect(rows[0].count).toBe(16);
  });
});

describe("row level security", () => {
  it("lets a user read built-in categories but not another user's custom ones", async () => {
    await asAlice(async () => {
      await db.query(
        `insert into public.categories (user_id, slug, name, icon, color, kind)
         values ($1, null, 'Alice secret', '🔒', 'violet', 'expense')`,
        [ALICE],
      );
    });

    await asBob(async () => {
      const { rows } = await db.query<{ name: string; user_id: string | null }>(
        `select name, user_id from public.categories`,
      );
      expect(rows.length).toBe(16);
      expect(rows.every((row) => row.user_id === null)).toBe(true);
      expect(rows.some((row) => row.name === "Alice secret")).toBe(false);
    });
  });

  it("isolates transactions between users", async () => {
    let aliceTransactionId = "";
    await asAlice(async () => {
      const { rows } = await db.query<{ id: string }>(
        `insert into public.transactions
           (user_id, kind, amount_satang, note, occurred_on)
         values ($1, 'expense', 12345, 'alice rent', '2026-03-01')
         returning id`,
        [ALICE],
      );
      aliceTransactionId = rows[0].id;
    });

    await asBob(async () => {
      const { rows: visible } = await db.query(
        `select id from public.transactions`,
      );
      expect(visible).toHaveLength(0);

      const { rows: updated } = await db.query(
        `update public.transactions set note = 'hacked' where id = $1 returning id`,
        [aliceTransactionId],
      );
      expect(updated).toHaveLength(0);

      const { rows: deleted } = await db.query(
        `delete from public.transactions where id = $1 returning id`,
        [aliceTransactionId],
      );
      expect(deleted).toHaveLength(0);

      await expect(
        db.query(
          `insert into public.transactions
             (user_id, kind, amount_satang, note, occurred_on)
           values ($1, 'expense', 100, 'forged', '2026-03-02')`,
          [ALICE],
        ),
      ).rejects.toThrow();
    });

    await asAlice(async () => {
      const { rows } = await db.query<{ note: string }>(
        `select note from public.transactions`,
      );
      expect(rows).toEqual([{ note: "alice rent" }]);
    });
  });

  it("rejects transactions attached to another user's category", async () => {
    let aliceCategoryId = "";
    await asAlice(async () => {
      const { rows } = await db.query<{ id: string }>(
        `select id from public.categories where name = 'Alice secret'`,
      );
      aliceCategoryId = rows[0].id;
    });

    await asBob(async () => {
      await expect(
        db.query(
          `insert into public.transactions
             (user_id, kind, amount_satang, category_id, note, occurred_on)
           values ($1, 'expense', 5000, $2, 'cross user', '2026-03-03')`,
          [BOB, aliceCategoryId],
        ),
      ).rejects.toThrow(/category does not belong/);
    });
  });

  it("allows global categories for any user", async () => {
    await asBob(async () => {
      const { rows: categoryRows } = await db.query<{ id: string }>(
        `select id from public.categories where slug = 'food'`,
      );
      const { rows } = await db.query<{ id: string }>(
        `insert into public.transactions
           (user_id, kind, amount_satang, category_id, note, occurred_on)
         values ($1, 'expense', 5000, $2, 'bob lunch', '2026-03-04')
         returning id`,
        [BOB, categoryRows[0].id],
      );
      expect(rows).toHaveLength(1);
    });
  });

  it("keeps budgets private and validated", async () => {
    const { rows: foodRows } = await db.query<{ id: string }>(
      `select id from public.categories where slug = 'food'`,
    );
    const foodId = foodRows[0].id;

    await asAlice(async () => {
      await db.query(
        `insert into public.category_budgets (user_id, category_id, month, amount_satang)
         values ($1, $2, '2026-03-01', 100000)`,
        [ALICE, foodId],
      );
    });

    await asBob(async () => {
      const { rows } = await db.query(`select id from public.category_budgets`);
      expect(rows).toHaveLength(0);

      await expect(
        db.query(
          `insert into public.category_budgets (user_id, category_id, month, amount_satang)
           values ($1, $2, '2026-03-01', 50000)`,
          [ALICE, foodId],
        ),
      ).rejects.toThrow();

      await expect(
        db.query(
          `insert into public.category_budgets (user_id, category_id, month, amount_satang)
           values ($1, $2, '2026-03-15', 50000)`,
          [BOB, foodId],
        ),
      ).rejects.toThrow(/category_budgets_month_check/);
    });
  });

  it("allows only the owner to read and update a profile", async () => {
    await asBob(async () => {
      const { rows } = await db.query<{ id: string; username: string }>(
        `select id, username from public.profiles`,
      );
      expect(rows).toEqual([{ id: BOB, username: "bob" }]);

      const { rows: attempt } = await db.query(
        `update public.profiles set display_name = 'Hacked' where id = $1 returning id`,
        [ALICE],
      );
      expect(attempt).toHaveLength(0);
    });
  });

  it("rejects invalid money and month values at the database boundary", async () => {
    await asBob(async () => {
      await expect(
        db.query(
          `insert into public.transactions
             (user_id, kind, amount_satang, note, occurred_on)
           values ($1, 'expense', 0, 'zero', '2026-03-05')`,
          [BOB],
        ),
      ).rejects.toThrow(/amount_satang_check/);

      await expect(
        db.query(
          `insert into public.transactions
             (user_id, kind, amount_satang, note, occurred_on)
           values ($1, 'transfer', 100, 'bad kind', '2026-03-05')`,
          [BOB],
        ),
      ).rejects.toThrow();
    });
  });
});
