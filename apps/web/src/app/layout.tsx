import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  keywords,
  longDescription,
  productName,
  productUrl,
  shortDescription,
} from "@focrel/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(productUrl),
  title: {
    default: `${productName} — ${shortDescription}`,
    template: `%s — ${productName}`,
  },
  description: longDescription,
  keywords: [...keywords],
  authors: [{ name: productName }],
  openGraph: {
    type: "website",
    siteName: productName,
    title: `${productName} — ${shortDescription}`,
    description: longDescription,
    url: productUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${productName} — ${shortDescription}`,
    description: longDescription,
  },
};

// Runs before React hydrates, so there's no flash of the wrong theme.
// Respects (in priority): explicit user choice in localStorage → OS preference.
// Desktop app uses the same `.dark` class convention, so brand tokens flip uniformly.
const themeInitScript = `try{var e=localStorage.getItem('focrel-theme');if(e==='dark'||(!e&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: productName,
  description: longDescription,
  url: productUrl,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "macOS 13+",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: undefined,
  author: { "@type": "Organization", name: productName, url: productUrl },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
