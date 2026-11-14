"use client";

import { AppShell } from "@/components/layout/app-shell";
import { TransactionComposerProvider } from "@/components/transactions/transaction-composer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TransactionComposerProvider>
      <AppShell>{children}</AppShell>
    </TransactionComposerProvider>
  );
}
