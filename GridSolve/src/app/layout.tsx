import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import JsonLd from "@/components/JsonLd";
import { CookieNotice } from "@/components/CookieNotice";
import { organizationJsonLd, webApplicationJsonLd } from "@/lib/seo";
import { getSiteUrl, seoKeywords, siteConfig } from "@/lib/site";
import "./globals.css";

// Fonts are served from this origin (no Google Fonts CDN) so visitor IPs are
// not sent to Google — the issue a Munich court fined in 2022.
const archivo = localFont({
  src: "./fonts/archivo-latin-wght-normal.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
});

const martianMono = localFont({
  src: "./fonts/martian-mono-latin-wght-normal.woff2",
  variable: "--font-mono",
  display: "swap",
  weight: "100 800",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...seoKeywords],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${martianMono.variable}`}
    >
      <body className="bg-[#07080a] text-neutral-200 antialiased">
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <JsonLd data={[organizationJsonLd(), webApplicationJsonLd()]} />
        <CookieNotice />
        <div id="content">{children}</div>
      </body>
    </html>
  );
}
