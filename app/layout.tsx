import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://helio.pixelarchitecture.dev";
const TITLE = "Helio CRM — The Calling Command Center";
const DESCRIPTION =
  "Timezone-aware queues, behavior-driven scheduling, and a sandbox so no lead gets wasted. A product of Pixel Architecture.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Helio CRM",
  },
  description: DESCRIPTION,
  applicationName: "Helio CRM",
  authors: [{ name: "Pixel Architecture", url: "https://www.pixelarchitecture.dev/" }],
  creator: "Pixel Architecture",
  publisher: "Pixel Architecture",
  keywords: [
    "CRM", "cold calling", "outbound", "sales", "agency",
    "lead management", "Pixel Architecture", "Helio",
    "calling software", "sales productivity",
  ],
  category: "business",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Helio CRM",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Helio CRM — the calling command center for closers.",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@pixelarchitect",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: { canonical: SITE_URL },
  other: {
    "powered-by": "Pixel Architecture (https://www.pixelarchitecture.dev/)",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0a1024" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans min-h-screen min-h-[100dvh] bg-background overflow-x-hidden">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
