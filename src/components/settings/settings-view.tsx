"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Download,
  FileJson,
  FileSpreadsheet,
  Globe2,
  KeyRound,
  Lock,
  LogOut,
  Moon,
  Palette,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sun,
  Tag,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import type { Category, CategoryBudget, Profile as ProfileType } from "@/lib/types";
import { categoryLabel } from "@/lib/categories";
import { formatDay } from "@/lib/date";
import {
  buildTransactionsCsv,
  buildTransactionsJson,
  downloadFile,
  exportFilename,
} from "@/lib/export";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/auth-provider";
import { useFinance } from "@/providers/finance-provider";
import { useLocale } from "@/providers/locale-provider";
import { useTheme } from "@/providers/theme-provider";
import { useToast } from "@/providers/toast-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Segmented } from "@/components/ui/segmented";
import { TextInput } from "@/components/ui/field";
import { CategorySheet } from "./category-sheet";

const APP_VERSION = "0.1.0";

export function SettingsView() {
  const {
    profile,
    categories,
    transactions,
    budgets,
    isDemo,
    updateDisplayName,
    updateLocalePreference,
    deleteCategory,
    clearTransactions,
    resetDemo,
  } = useFinance();
  const { user, signOut } = useAuth();
  const { t, locale, setLocale, formatDate, formatMoney } = useLocale();
  const { mode, setMode } = useTheme();
  const { toast } = useToast();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [confirmingCategory, setConfirmingCategory] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const next = profile?.displayName ?? "";
    setDisplayName((current) => (current === next ? current : next));
  }, [profile?.displayName]);

  const profileChanged =
    displayName.trim().length > 0 &&
    displayName.trim() !== (profile?.displayName ?? "");

  const saveProfile = async () => {
    if (!profileChanged) return;
    setSavingProfile(true);
    try {
      await updateDisplayName(displayName.trim());
      toast({ title: t("settings.profileSaved") });
    } catch {
      toast({ title: t("toast.error"), variant: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const changeLocale = async (next: "th" | "en") => {
    setLocale(next);
    try {
      await updateLocalePreference(next);
      toast({ title: t("settings.languageSaved") });
    } catch {
      // The local preference still applies for this session.
    }
  };

  const exportCsv = () => {
    try {
      const contents = buildTransactionsCsv(transactions, categories, locale);
      const filename = exportFilename(t("export.filename"), "csv");
      downloadFile(contents, filename, "text/csv;charset=utf-8");
      toast({ title: t("toast.exported", { file: filename }) });
    } catch {
      toast({ title: t("errors.export"), variant: "error" });
    }
  };

  const exportJson = () => {
    try {
      const contents = buildTransactionsJson(
        transactions,
        categories,
        budgets as CategoryBudget[],
        (profile as ProfileType | null) ?? null,
      );
      const filename = exportFilename(t("export.jsonFilename"), "json");
      downloadFile(contents, filename, "application/json");
      toast({ title: t("toast.exported", { file: filename }) });
    } catch {
      toast({ title: t("errors.export"), variant: "error" });
    }
  };

  const removeCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      toast({ title: t("settings.categoryDeleted") });
      setConfirmingCategory(null);
    } catch {
      toast({ title: t("toast.error"), variant: "error" });
    }
  };

  const deleteAll = async () => {
    setClearing(true);
    try {
      await clearTransactions();
      toast({ title: t("settings.allDeleted") });
      setConfirmingClear(false);
    } catch {
      toast({ title: t("toast.error"), variant: "error" });
    } finally {
      setClearing(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemo();
      toast({ title: t("settings.demoReset") });
    } catch {
      toast({ title: t("toast.error"), variant: "error" });
    } finally {
      setResetting(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.replace("/sign-in");
  };

  const expenseCategories = categories.filter((category) => category.kind === "expense");
  const incomeCategories = categories.filter((category) => category.kind === "income");

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow={t("nav.settings")}
        title={t("settings.title")}
        description={t("settings.subtitle")}
        actions={
          <Button variant="secondary" size="sm" onClick={exportCsv} className="gap-1.5">
            <Download className="size-3.5" />
            {t("settings.exportCsv")}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="rounded-[24px] border border-line bg-surface p-5 shadow-card lg:col-span-7">
          <SectionTitle
            icon={<UserRound className="size-4" />}
            title={t("settings.profile")}
            description={t("settings.profileDescription")}
          />
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-surface-2/50 p-3.5">
            <Avatar name={profile?.displayName || profile?.username || "Bahtwise"} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-ink">
                {profile?.displayName || profile?.username}
              </p>
              <p className="truncate text-[11px] text-subtle">
                @{profile?.username ?? "—"}
              </p>
            </div>
            {isDemo ? (
              <span className="ml-auto rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-ink dark:text-accent">
                {t("common.demo")}
              </span>
            ) : (
              <BadgeCheck className="ml-auto size-4 text-primary" />
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[13px] font-semibold text-ink">
                {t("settings.displayName")}
              </span>
              <TextInput
                value={displayName}
                maxLength={48}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={t("settings.namePlaceholder")}
              />
            </label>
            <div className="space-y-1.5">
              <span className="text-[13px] font-semibold text-ink">
                {t("settings.username")}
              </span>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface-2/60 px-3.5 text-sm text-muted">
                <KeyRound className="size-3.5 text-subtle" />
                <span className="truncate">{profile?.username ?? "—"}</span>
                <Lock className="ml-auto size-3 text-subtle" />
              </div>
              <p className="text-[10px] leading-relaxed text-subtle">
                {t("settings.usernameLocked")}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle">
                {t("settings.email")}
              </p>
              <p className="truncate text-[12px] font-medium text-ink">
                {profile?.email || user?.email || t("settings.noEmail")}
              </p>
            </div>
            <p className="shrink-0 text-[10px] text-subtle">
              {t("settings.memberSince")}{" "}
              {profile ? formatDate(profile.createdAt.slice(0, 10), "short") : "—"}
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              loading={savingProfile}
              disabled={!profileChanged}
              onClick={() => void saveProfile()}
            >
              {t("settings.saveProfile")}
            </Button>
          </div>
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-5 shadow-card lg:col-span-5">
          <SectionTitle
            icon={<Palette className="size-4" />}
            title={t("settings.appearance")}
            description={t("settings.appearanceDescription")}
          />

          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold text-ink">
              {t("settings.theme")}
            </p>
            <Segmented
              fullWidth
              ariaLabel={t("settings.theme")}
              value={mode}
              onChange={(next) => {
                setMode(next);
                toast({ title: t("settings.themeSaved") });
              }}
              options={[
                { value: "light", label: t("settings.light"), icon: <Sun className="size-3.5" /> },
                { value: "dark", label: t("settings.dark"), icon: <Moon className="size-3.5" /> },
                { value: "system", label: t("settings.system"), icon: <Settings2 className="size-3.5" /> },
              ]}
            />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold text-ink">
              {t("settings.language")}
            </p>
            <Segmented
              fullWidth
              ariaLabel={t("settings.language")}
              value={locale}
              onChange={(next) => void changeLocale(next)}
              options={[
                { value: "th", label: t("settings.languageThai"), icon: <Globe2 className="size-3.5" /> },
                { value: "en", label: t("settings.languageEnglish"), icon: <Globe2 className="size-3.5" /> },
              ]}
            />
          </div>

          <div className="mt-4 rounded-xl border border-line bg-surface-2/50 p-3">
            <p className="text-[10px] leading-relaxed text-muted">
              {locale === "th"
                ? "ธีมและภาษาจะถูกจดจำไว้ในเบราว์เซอร์นี้ และซิงก์กับบัญชีของคุณเมื่อเชื่อมต่อ Supabase"
                : "Theme and language are remembered in this browser and synced to your account when Supabase is connected."}
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="rounded-[24px] border border-line bg-surface p-5 shadow-card lg:col-span-5">
          <SectionTitle
            icon={<Wallet className="size-4" />}
            title={t("settings.budget")}
            description={t("settings.budgetDescription")}
            action={
              <Link
                href="/budgets"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                {t("nav.budgets")}
                <ArrowRight className="size-3" />
              </Link>
            }
          />
          <div className="mt-4 flex items-end justify-between gap-3 rounded-2xl bg-hero p-4 text-hero-ink">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-hero-muted">
                {t("budgets.overall")}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
                {profile?.monthlyBudgetSatang
                  ? formatMoney(profile.monthlyBudgetSatang, { withDecimals: false })
                  : t("budgets.noLimit")}
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-white/10">
              <Wallet className="size-5" />
            </span>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-subtle">
            {t("settings.currencyDescription")}
          </p>
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-5 shadow-card lg:col-span-7">
          <SectionTitle
            icon={<BadgeCheck className="size-4" />}
            title={t("settings.metrics")}
            description={t("settings.accountDescription")}
          />
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Metric
              label={t("settings.totalTransactions")}
              value={String(transactions.length)}
            />
            <Metric
              label={t("settings.totalCategories")}
              value={String(categories.length)}
            />
            <Metric
              label={t("settings.currency")}
              value="THB · สตางค์"
            />
            <Metric
              label={t("settings.memberSince")}
              value={
                profile ? formatDay(profile.createdAt.slice(0, 10), locale, "monthShort") : "—"
              }
            />
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/15 bg-primary-soft/40 px-3 py-2">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            <p className="text-[10px] leading-relaxed text-muted">
              {t("settings.rlsDescription")}
            </p>
          </div>
        </section>
      </div>

      <section className="rounded-[24px] border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle
            icon={<Tag className="size-4" />}
            title={t("settings.categories")}
            description={t("settings.categoriesDescription")}
          />
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setCategorySheetOpen(true)}
          >
            <Plus className="size-3.5" />
            {t("settings.addCategory")}
          </Button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <CategoryGroup
            title={t("home.kindExpense")}
            categories={expenseCategories}
            confirmingId={confirmingCategory}
            onAskDelete={setConfirmingCategory}
            onDelete={(id) => void removeCategory(id)}
            onCancel={() => setConfirmingCategory(null)}
          />
          <CategoryGroup
            title={t("home.kindIncome")}
            categories={incomeCategories}
            confirmingId={confirmingCategory}
            onAskDelete={setConfirmingCategory}
            onDelete={(id) => void removeCategory(id)}
            onCancel={() => setConfirmingCategory(null)}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] border border-line bg-surface p-5 shadow-card">
          <SectionTitle
            icon={<Download className="size-4" />}
            title={t("settings.data")}
            description={t("settings.dataDescription")}
          />
          <div className="mt-4 space-y-2">
            <ExportRow
              icon={<FileSpreadsheet className="size-4" />}
              title={t("settings.exportCsv")}
              description={t("settings.exportCsvDescription")}
              action={
                <Button variant="secondary" size="sm" onClick={exportCsv}>
                  {t("settings.exportCsv")}
                </Button>
              }
            />
            <ExportRow
              icon={<FileJson className="size-4" />}
              title={t("settings.exportJson")}
              description={t("settings.exportJsonDescription")}
              action={
                <Button variant="secondary" size="sm" onClick={exportJson}>
                  {t("settings.exportJson")}
                </Button>
              }
            />
          </div>
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-5 shadow-card">
          <SectionTitle
            icon={<ShieldCheck className="size-4" />}
            title={t("settings.account")}
            description={t("settings.accountDescription")}
          />
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <UserRound className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-subtle">
                  {t("settings.signedInAs")}
                </p>
                <p className="truncate text-[12px] font-semibold text-ink">
                  {profile?.displayName || profile?.username || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                {isDemo ? <RefreshCw className="size-4" /> : <ShieldCheck className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-subtle">
                  {isDemo ? t("settings.demoAccount") : t("settings.supabaseConnected")}
                </p>
                <p className="truncate text-[12px] font-semibold text-ink">
                  {isDemo ? t("settings.demoDescription") : t("settings.supabaseDescription")}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full gap-1.5"
              loading={signingOut}
              onClick={() => void handleSignOut()}
            >
              <LogOut className="size-4" />
              {t("nav.signOut")}
            </Button>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] border border-line bg-surface p-5 shadow-card">
          <SectionTitle
            icon={<Lock className="size-4" />}
            title={t("settings.privacy")}
            description={t("settings.privacyDescription")}
          />
          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-2/50 p-3">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="text-[10px] leading-relaxed text-muted">
                {t("settings.rls")} — {t("settings.rlsDescription")}
              </p>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-2/50 p-3">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="text-[10px] leading-relaxed text-muted">
                {locale === "th"
                  ? "จำนวนเงินถูกเก็บเป็นสตางค์จำนวนเต็ม ไม่มีการคำนวณทศนิยมลอยตัว"
                  : "Amounts are stored as integer satang. No floating-point money is ever stored."}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-subtle">
            {t("settings.version", { version: APP_VERSION })}
          </p>
        </section>

        <section className="rounded-[24px] border border-expense/20 bg-surface p-5 shadow-card">
          <SectionTitle
            icon={<CircleAlert className="size-4 text-expense" />}
            title={t("settings.dangerZone")}
            description={t("settings.deleteAllDescription")}
          />

          <div className="mt-4 space-y-2">
            {confirmingClear ? (
              <div className="rounded-xl border border-expense/25 bg-expense-soft/60 p-3">
                <p className="text-[11px] font-semibold text-expense">
                  {t("settings.deleteAllConfirm", { count: transactions.length })}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmingClear(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    loading={clearing}
                    onClick={() => void deleteAll()}
                  >
                    {t("common.delete")}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-3 text-left transition-colors hover:border-expense/30 hover:bg-expense-soft/30"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-expense-soft text-expense">
                  <Trash2 className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-ink">
                    {t("settings.deleteAll")}
                  </span>
                  <span className="block text-[10px] text-subtle">
                    {t("settings.deleteAllDescription")}
                  </span>
                </span>
              </button>
            )}

            {isDemo ? (
              <button
                type="button"
                onClick={() => void handleReset()}
                disabled={resetting}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2 disabled:opacity-60"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <RefreshCw className={cn("size-4", resetting && "animate-spin")} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-ink">
                    {t("settings.resetDemo")}
                  </span>
                  <span className="block text-[10px] text-subtle">
                    {t("settings.resetDemoDescription")}
                  </span>
                </span>
              </button>
            ) : null}
          </div>
        </section>
      </div>

      <CategorySheet
        open={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
      />
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-lg font-semibold leading-tight tracking-[-0.015em] text-ink">
          {title}
        </h2>
        <p className="mt-0.5 text-[10px] leading-relaxed text-subtle">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-3">
      <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-subtle">
        {label}
      </p>
      <p className="mt-1 truncate text-[13px] font-bold text-ink">{value}</p>
    </div>
  );
}

function ExportRow({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-ink">{title}</p>
        <p className="text-[10px] leading-relaxed text-subtle">{description}</p>
      </div>
      {action}
    </div>
  );
}

function CategoryGroup({
  title,
  categories,
  confirmingId,
  onAskDelete,
  onDelete,
  onCancel,
}: {
  title: string;
  categories: Category[];
  confirmingId: string | null;
  onAskDelete: (id: string | null) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}) {
  const { t, locale } = useLocale();

  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-subtle">
        {title} · {categories.length}
      </p>
      <div className="space-y-1.5">
        {categories.map((category) => {
          const custom = category.slug === null;
          const confirming = confirmingId === category.id;
          return (
            <div
              key={category.id}
              className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/40 p-2"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-base">
                {category.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-ink">
                  {categoryLabel(category, locale)}
                </p>
                <p className="text-[9px] text-subtle">
                  {custom ? t("settings.customCategory") : t("settings.builtinCategory")}
                </p>
              </div>
              {confirming ? (
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md px-1.5 py-1 text-[9px] font-semibold text-muted hover:bg-line/60"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(category.id)}
                    className="rounded-md bg-expense px-1.5 py-1 text-[9px] font-semibold text-white hover:brightness-110"
                  >
                    {t("common.delete")}
                  </button>
                </span>
              ) : custom ? (
                <button
                  type="button"
                  onClick={() => onAskDelete(category.id)}
                  aria-label={t("settings.deleteCategory")}
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-subtle transition-colors hover:bg-expense-soft hover:text-expense"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : (
                <Lock className="size-3 shrink-0 text-subtle/60" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
