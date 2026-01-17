import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Merriweather } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { AppearanceProvider } from "@/components/appearance-provider"
import { Toaster } from "@/components/ui/sonner"
import { OfflineIndicator } from "@/components/ui/offline-indicator"
import { OfflineSyncProvider } from "@/components/providers/OfflineSyncProvider"
import { PennyProvider } from "@/components/penny/PennyContext"

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
  title: "Kharcho",
  description: "Expense Management for your business",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kharcho",
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
            <PennyProvider>
              <OfflineSyncProvider>
                {children}
                <OfflineIndicator />
              </OfflineSyncProvider>
            </PennyProvider>
            <Toaster />
          </AppearanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
