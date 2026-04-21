import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://focrel.app"),
  title: {
    default: "Focrel — Context-switching focus app for macOS",
    template: "%s — Focrel",
  },
  description:
    "Bind each focus context to its own wallpaper, music, to-do list, and macOS Focus mode. Switch contexts, switch realms.",
  keywords: [
    "focus app",
    "macOS",
    "deep work",
    "context switching",
    "pomodoro",
    "productivity",
  ],
  authors: [{ name: "Focrel" }],
  openGraph: {
    type: "website",
    siteName: "Focrel",
    title: "Focrel — Context-switching focus app for macOS",
    description:
      "Bind each focus context to its own wallpaper, music, to-do list, and macOS Focus mode.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Focrel — Context-switching focus app",
    description:
      "Bind each focus context to its own wallpaper, music, to-do list, and macOS Focus mode.",
  },
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
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
