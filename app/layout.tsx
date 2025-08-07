import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "@/components/common/PostHogProvider";
import { AuthProvider } from "@/lib/auth/context";
import MainNavbar from "@/components/MainNavbar";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <PostHogProvider>
          <AuthProvider>
            <MainNavbar />
            {children}
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
