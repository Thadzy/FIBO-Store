"use client";
import React from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react"; // 👈 เรียกใช้ NextAuth

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function Navbar({
  cartCount,
  onCartClick,
  searchTerm,
  onSearchChange,
}: NavbarProps) {
  // 1. ดึงข้อมูล Session (สถานะการ Login)
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          {/* --- LEFT: LOGO --- */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
              🥀
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
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-bold text-orange-600 bg-orange-50 rounded-lg"
            >
              หน้าหลัก
            </Link>

            {/* โชว์เมนู Admin เฉพาะคนที่เป็น Admin */}
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
              ประวัติการยืม
            </Link>
          </div>

          {/* --- RIGHT: SEARCH & CART & PROFILE --- */}
          <div className="flex items-center gap-3 flex-1 md:flex-none justify-end">
            {/* Search Bar */}
            <div className="relative group w-full md:w-48 lg:w-64 hidden sm:block">
              <input
                type="text"
                className="block w-full pl-3 pr-3 py-2 border border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                placeholder="ค้นหาอุปกรณ์..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            {/* Cart Button */}
            <button
              onClick={onCartClick}
              className="relative p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all active:scale-95"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
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
              // กรณี: Login แล้ว -> โชว์รูป + ปุ่ม Logout
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
                    src={
                      session.user?.image ||
                      "https://ui-avatars.com/api/?name=User"
                    }
                    alt="Profile"
                    className="w-9 h-9 rounded-full border-2 border-slate-100 shadow-sm"
                  />
                  {/* Logout Dropdown (โชว์เมื่อเอาเมาส์จ่อรูป) */}
                  {/* 1. สร้าง Wrapper ใสๆ ขึ้นมาครอบ (ย้าย hidden group-hover:block มาไว้ที่นี่) */}
                  <div className="absolute right-0 top-full pt-2 w-32 hidden group-hover:block animate-in fade-in zoom-in duration-200">
                    {/* 2. ตัวกล่องสีขาวอยู่ข้างใน (ลบ mt-2, absolute, top-full ออก เพราะตัวแม่จัดการแล้ว) */}
                    <div className="bg-white rounded-lg shadow-xl border border-slate-100 p-1">
                      <button
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
              // กรณี: ยังไม่ Login -> โชว์ปุ่ม Login
              <button
                onClick={() => signIn("google")} // เด้งไปหน้า Login
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
