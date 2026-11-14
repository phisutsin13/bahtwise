import { describe, expect, it } from "vitest";
import { DemoRepository } from "@/lib/repository";
import { DEMO_USER_ID } from "@/lib/demo-data";
import type { TransactionInput } from "@/lib/types";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
}

const input: TransactionInput = {
  kind: "expense",
  amountSatang: 12_345,
  categoryId: null,
  note: "private note",
  occurredOn: "2026-03-18",
};

describe("demo repository isolation", () => {
  it("stores each user's data under a distinct key", () => {
    const storage = new MemoryStorage();
    const alice = new DemoRepository("alice", storage, "en");
    const bob = new DemoRepository("bob", storage, "en");

    expect(DemoRepository.storageKey("alice")).not.toBe(
      DemoRepository.storageKey("bob"),
    );

    return Promise.all([
      alice.addTransaction(input),
      bob.addTransaction({ ...input, amountSatang: 99_999, note: "bob only" }),
    ]).then(async () => {
      expect(storage.getItem(DemoRepository.storageKey("alice"))).toContain(
        "private note",
      );
      expect(storage.getItem(DemoRepository.storageKey("bob"))).toContain("bob only");
      expect(storage.getItem(DemoRepository.storageKey("alice"))).not.toContain(
        "bob only",
      );
    });
  });

  it("does not leak transactions, categories or budgets between users", async () => {
    const storage = new MemoryStorage();
    const alice = new DemoRepository("alice", storage, "en");
    const bob = new DemoRepository("bob", storage, "en");

    const bobBefore = await bob.listTransactions();
    const created = await alice.addTransaction(input);
    const category = await alice.addCategory({
      name: "Alice only",
      icon: "🔒",
      color: "violet",
      kind: "expense",
    });
    await alice.upsertCategoryBudget(category.id, "2026-03-01", 50_000);

    const bobAfter = await bob.listTransactions();
    expect(bobAfter).toHaveLength(bobBefore.length);
    expect(bobAfter.some((row) => row.id === created.id)).toBe(false);
    expect((await bob.listCategories()).some((row) => row.name === "Alice only")).toBe(
      false,
    );
    expect(
      (await bob.listBudgets()).some((row) => row.categoryId === category.id),
    ).toBe(false);
    expect((await bob.getProfile()).id).toBe("bob");
    expect((await alice.getProfile()).id).toBe("alice");
  });

  it("persists changes for a user across repository instances", async () => {
    const storage = new MemoryStorage();
    const first = new DemoRepository("alice", storage, "en");
    const created = await first.addTransaction(input);

    const second = new DemoRepository("alice", storage, "en");
    const rows = await second.listTransactions();
    expect(rows.some((row) => row.id === created.id)).toBe(true);
  });

  it("uses the shared demo user id by default", async () => {
    const storage = new MemoryStorage();
    const repository = new DemoRepository(undefined, storage);
    expect(repository.userId).toBe(DEMO_USER_ID);
    expect(await repository.getProfile()).toBeTruthy();
    expect((await repository.listCategories()).length).toBeGreaterThan(5);
  });

  it("resetDemo restores seeded data for that user only", async () => {
    const storage = new MemoryStorage();
    const alice = new DemoRepository("alice", storage, "en");
    const bob = new DemoRepository("bob", storage, "en");
    const aliceSeed = (await alice.listTransactions()).length;
    await alice.addTransaction(input);
    await bob.addTransaction(input);

    await alice.resetDemo();

    expect((await alice.listTransactions()).length).toBe(aliceSeed);
    expect(
      (await bob.listTransactions()).some((row) => row.note === input.note),
    ).toBe(true);
  });
});
