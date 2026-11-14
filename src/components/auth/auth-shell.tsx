"use client";

import { Logo } from "@/components/ui/logo";
import { LanguageToggle, ThemeToggle } from "@/components/ui/theme-toggles";
import { useLocale } from "@/providers/locale-provider";
import { FadeIn } from "@/components/ui/motion";
import { BarChart3, Languages, ShieldCheck, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: ShieldCheck, title: "auth.featurePrivate", body: "auth.featurePrivateDescription" },
  { icon: Languages, title: "auth.featureBilingual", body: "auth.featureBilingualDescription" },
  { icon: BarChart3, title: "auth.featureClarity", body: "auth.featureClarityDescription" },
] as const;

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
      <aside className="relative hidden overflow-hidden bg-hero text-hero-ink lg:flex lg:flex-col lg:justify-between">
        <div className="hero-grain pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-40 -top-48 size-[38rem] rounded-full bg-[radial-gradient(circle,rgba(215,233,107,0.22),transparent_65%)]" />
        <div className="pointer-events-none absolute -bottom-48 -left-24 size-[32rem] rounded-full bg-[radial-gradient(circle,rgba(115,220,170,0.16),transparent_68%)]" />
        <svg
          className="pointer-events-none absolute right-[-12%] top-[12%] h-[70%] w-[70%] opacity-[0.13]"
          viewBox="0 0 600 600"
          fill="none"
          aria-hidden="true"
        >
          {[120, 180, 240, 300, 360].map((radius) => (
            <circle
              key={radius}
              cx="300"
              cy="300"
              r={radius}
              stroke="#F7F4E8"
              strokeWidth="1"
              strokeDasharray={radius === 300 ? "4 8" : undefined}
            />
          ))}
          <circle cx="300" cy="300" r="6" fill="#D7E96B" />
        </svg>

        <div className="relative z-10 flex items-center justify-between px-10 pt-10 xl:px-14">
          <Logo size="md" inverted />
          <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-hero-muted">
            {t("app.tagline")}
          </span>
        </div>

        <div className="relative z-10 max-w-[560px] px-10 pt-12 xl:px-14">
          <FadeIn delay={0.04}>
            <p className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              <Sparkles className="size-3.5" />
              Personal finance, quietly beautiful
            </p>
            <h1 className="font-display text-[clamp(2.7rem,4.5vw,4.6rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-balance">
              {t("auth.brandLine")}
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-hero-muted">
              {t("auth.brandSubline")}
            </p>
          </FadeIn>

          <FadeIn delay={0.14}>
            <div className="relative mt-10 max-w-[420px]">
              <div className="absolute -right-8 -top-9 hidden size-24 animate-float-slow place-items-center rounded-full border border-accent/30 bg-accent/10 xl:grid">
                <div className="text-center">
                  <p className="font-display text-2xl font-semibold text-accent">฿</p>
                  <p className="text-[9px] uppercase tracking-widest text-hero-muted">satang</p>
                </div>
              </div>
              <div className="rotate-[-1.2deg] rounded-[26px] border border-white/14 bg-white/[0.075] p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-transform duration-700 hover:rotate-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-hero-muted">
                      {t("home.thisMonth")}
                    </p>
                    <p className="mt-1 font-display text-[34px] font-semibold tracking-[-0.02em] text-hero-ink">
                      ฿42,680<span className="text-hero-muted">.50</span>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-semibold text-accent">
                    <span className="size-1.5 rounded-full bg-accent" />
                    68% on track
                  </span>
                </div>
                <div className="mt-4 flex items-end gap-1.5" aria-hidden="true">
                  {[38, 64, 44, 78, 52, 88, 66, 96, 72, 82, 58, 90].map((height, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-t-[3px] bg-gradient-to-t from-accent/20 to-accent/80"
                      style={{ height: `${height * 0.48}px`, opacity: 0.45 + index * 0.045 }}
                    />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-hero-muted">
                      {t("home.totalIncome")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#9fe8c6]">+฿58,500.00</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-hero-muted">
                      {t("home.totalExpense")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#ffab94]">−฿15,819.50</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="relative z-10 grid gap-4 px-10 pb-10 pt-12 xl:grid-cols-3 xl:px-14">
          {FEATURES.map((feature, index) => (
            <FadeIn key={feature.title} delay={0.2 + index * 0.05}>
              <div className="flex gap-2.5">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-accent">
                  <feature.icon className="size-3.5" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-hero-ink">{t(feature.title)}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-hero-muted">
                    {t(feature.body)}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </aside>

      <main className="relative flex min-h-dvh flex-col">
        <div className="flex items-center justify-between px-5 pt-5 sm:px-8 lg:justify-end lg:px-10 lg:pt-8">
          <Logo size="sm" className="lg:hidden" />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
        <div className="px-5 pb-6 text-center text-[11px] leading-relaxed text-subtle sm:px-8">
          <p>{t("auth.demoNote")}</p>
        </div>
      </main>
    </div>
  );
}
