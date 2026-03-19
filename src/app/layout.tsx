import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { CommandMenuLoader } from "@/components/command-menu-loader";
import { AgentationLoader } from "@/components/agentation-loader";

import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_REPO_URL,
} from "@/lib/site";

const siteUrl = getSiteUrl();

const commitMono = localFont({
  src: "../../public/fonts/CommitMono-VF.woff2",
  variable: "--font-commit-mono",
  display: "swap",
});

const helveticaHeavyCn = localFont({
  src: "../../public/fonts/HelveticaNeueLTProHvCn.woff2",
  variable: "--font-helvetica-hv-cn",
  weight: "800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  other: {
    "theme-color": "#050505",
  },
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: siteUrl,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Cross-platform",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  sameAs: [SITE_REPO_URL],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
        />
      </head>
      <body
        className={`${commitMono.variable} ${helveticaHeavyCn.variable} antialiased`}

      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:border focus:border-border"
        >
          Skip to main content
        </a>
        <Providers>
          <Nav />
          <CommandMenuLoader />
          <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-12">
            {children}
          </main>
          <Footer />
          <AgentationLoader />
        </Providers>
      </body>
    </html>
  );
}
