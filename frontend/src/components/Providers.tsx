"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

/**
 * Props for the Providers component.
 */
interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Providers Component
 * * Acts as a centralized wrapper for all global React Context providers.
 * Primarily used here to expose the NextAuth session context to the entire application,
 * allowing useSession() hooks to function in client components.
 *
 * @param children - The nested components of the application tree.
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}