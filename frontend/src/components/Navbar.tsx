"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";

/**
 * Props for the Navbar component.
 */
interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

/**
 * Navbar Component
 * The primary navigation header for the application.
 */
export default function Navbar({
  cartCount,
  onCartClick,
  searchTerm,
  onSearchChange,
}: NavbarProps) {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          
          {/* --- LEFT: LOGO --- */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md shadow-orange-500/10 p-1.5 overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform">
              <Image
                src="/FIBO.png" 
                alt="FIBO Logo"
                width={48}
                height={48}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            
            <div className="flex flex-col">
              <span className="text-2xl font-black text-blue-900 tracking-tighter leading-none group-hover:text-orange-600 transition-colors">
                FIBO
                <span className="text-orange-500 group-hover:text-blue-900">
                  STORE
                </span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Inventory System
              </span>
            </div>
          </Link>

          {/* --- MIDDLE: MENU LINKS --- */}
          {/* Note: 'hidden md:flex' hides these links on mobile screens */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-bold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              Home
            </Link>
            
            <Link
              href="/active"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              Active Loans
            </Link>

            {/* Admin Console Link (Conditional Render) */}
            {session?.user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                  Admin Console
                </Link>
            )}
            
            <Link
              href="/history"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              History
            </Link>
          </div>

          {/* --- RIGHT: SEARCH & CART & PROFILE --- */}
          <div className="flex items-center gap-3 flex-1 md:flex-none justify-end">
            
            {/* Search Bar */}
            <div className="relative group w-full md:w-48 lg:w-64 hidden sm:block">
              <input
                type="text"
                aria-label="Search inventory"
                className="block w-full pl-3 pr-3 py-2 border border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            {/* Cart Button */}
            <button
              type="button"
              onClick={onCartClick}
              aria-label="Open cart"
              className="relative p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            {/* --- LOGIN / PROFILE SECTION --- */}
            {session ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end hidden lg:flex">
                  <span className="text-xs font-bold text-slate-700">
                    {session.user?.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {session.user?.email}
                  </span>
                </div>

                <div className="relative group">
                  <img
                    src={session.user?.image || "https://ui-avatars.com/api/?name=User"}
                    alt="User Profile"
                    className="w-9 h-9 rounded-full border-2 border-slate-100 shadow-sm object-cover"
                  />
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full pt-2 w-32 hidden group-hover:block animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-lg shadow-xl border border-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => signOut()}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signIn("google")}
                className="bg-blue-900 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-blue-800 transition-all shadow-md shadow-blue-900/20"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}