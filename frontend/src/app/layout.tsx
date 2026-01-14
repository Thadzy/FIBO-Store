import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

/**
 * Application Metadata
 * Defines the default title and description for the application.
 */
export const metadata: Metadata = {
  title: "FIBO STORE | Inventory System",
  description: "Student Equipment Requisition System for FIBO KMUTT",
};

/**
 * RootLayout Component
 * * The top-level layout wrapper for the entire application.
 * It wraps all pages with the necessary Providers (like NextAuth SessionProvider)
 * and applies global styles.
 *
 * @param children - The page content to be rendered.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900 bg-slate-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}