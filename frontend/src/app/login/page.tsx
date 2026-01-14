"use client";

import { signIn } from "next-auth/react";

/**
 * LoginPage Component
 * * This component provides the user interface for authentication.
 * It features a centralized login card with a modern glassmorphism effect.
 * Authentication is handled via NextAuth's Google Provider.
 */
export default function LoginPage() {
  /**
   * Handles the Google Sign-In process.
   * Redirects the user to the homepage ('/') upon successful authentication.
   */
  const handleLogin = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="bg-white/10 backdrop-blur-lg p-10 rounded-3xl border border-white/20 shadow-2xl text-center max-w-sm w-full">
        
        {/* Logo / Icon Container */}
        <div className="w-20 h-20 bg-orange-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-orange-500/40">
          {/* Inventory/Box Icon */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-10 h-10 text-white"
          >
            <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 00.372.648l8.628 5.033z" />
          </svg>
        </div>

        <h1 className="text-3xl font-black mb-2 tracking-tight">FIBO STORE</h1>
        <p className="text-slate-300 mb-8 text-sm">
          Student Equipment Requisition System
        </p>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-white text-slate-900 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95 group"
          aria-label="Sign in with KMUTT Google Account"
        >
          {/* Google Icon SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with KMUTT Account
        </button>

        <p className="mt-6 text-xs text-slate-400">
          Only <span className="text-orange-400 font-mono">@mail.kmutt.ac.th</span> accounts are authorized.
        </p>
      </div>
    </div>
  );
}