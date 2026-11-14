import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/providers/theme-provider";
import { LocaleProvider } from "@/providers/locale-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { FinanceProvider } from "@/providers/finance-provider";
import { MotionProvider } from "@/components/ui/motion";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-latin",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const bodyFont = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "My Money — ทุกบาทมีเรื่องเล่า",
    template: "%s · My Money",
  },
  description:
    "A calm, private income and expense tracker for Thailand. Bilingual, beautiful, and built around every baht.",
  applicationName: "My Money",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "My Money",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "My Money",
    description: "Your money, in focus. A bilingual personal finance tracker.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2eee3" },
    { media: "(prefers-color-scheme: dark)", color: "#0a110e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <MotionProvider>
          <ThemeProvider>
            <LocaleProvider>
              <ToastProvider>
                <AuthProvider>
                  <FinanceProvider>{children}</FinanceProvider>
                </AuthProvider>
              </ToastProvider>
            </LocaleProvider>
          </ThemeProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
