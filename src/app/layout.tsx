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
  title: "丸わかり金銭管理ツール",
  description: "給料日サイクル型 一目でわかる金銭管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden overscroll-none antialiased bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}
    >
      <body className="h-full min-h-full overflow-hidden overscroll-none flex flex-col bg-slate-100 dark:bg-slate-950">
        {children}
      </body>
    </html>
  );
}
