import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Merriweather } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { AppearanceProvider } from "@/components/appearance-provider"
import { Toaster } from "@/components/ui/sonner"
import { OfflineIndicator } from "@/components/ui/offline-indicator"
import { OfflineSyncProvider } from "@/components/providers/OfflineSyncProvider"
import { SiaProvider } from "@/components/sia/SiaContext"
import { ExpensePanelProvider } from "@/components/expenses/ExpensePanelContext"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Spendly",
  description: "Expense Management for your business",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-icon-filled.png",
    apple: "/logo-icon-filled.png",
    shortcut: "/logo-icon-filled.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Spendly",
  },
  openGraph: {
    title: "Spendly",
    description: "Expense Management for your business",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Spendly - Intelligent Expense Management",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${merriweather.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppearanceProvider>
            <SiaProvider>
              <ExpensePanelProvider>
                <OfflineSyncProvider>
                  {children}
                  <OfflineIndicator />
                </OfflineSyncProvider>
              </ExpensePanelProvider>
            </SiaProvider>
            <Toaster />
          </AppearanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
