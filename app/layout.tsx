import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/common/PostHogProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Real Estate Pro Tools | Professional Real Estate Calculations",
  description: "Professional real estate calculations & client management tools for the Portuguese market. Calculate IMT, stamp duty, commissions, and more.",
  keywords: "real estate calculator, portugal, imt calculator, property costs, real estate tools",
  openGraph: {
    title: "Real Estate Pro Tools",
    description: "Professional Real Estate Calculations & Client Management - Simplified",
    url: "https://realestateprotools.com",
    siteName: "Real Estate Pro Tools",
    locale: "pt_PT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
