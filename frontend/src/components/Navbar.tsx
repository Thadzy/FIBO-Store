import React from "react";
import Link from "next/link"; // อย่าลืม import Link ของ Next.js

// interface NavbarProps {
//   cartCount: number;
//   onCartClick: () => void;
//   searchTerm: string;
//   onSearchChange: (value: string) => void;
// }

export default function Navbar({ 
  cartCount, 
  onCartClick, 
  searchTerm, 
  onSearchChange 
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          
          {/* --- LEFT: LOGO --- */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
              ⚙️
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-blue-900 tracking-tighter leading-none group-hover:text-orange-600 transition-colors">
                FIBO<span className="text-orange-500 group-hover:text-blue-900">STORE</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Inventory System
              </span>
            </div>
          </Link>

          {/* --- MIDDLE: MENU LINKS (เพิ่มส่วนนี้มา) --- */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/" className="px-3 py-2 text-sm font-bold text-orange-600 bg-orange-50 rounded-lg">
              หน้าหลัก
            </Link>
            <Link href="/history" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-900 hover:bg-slate-50 rounded-lg transition-colors">
              ประวัติการยืม
            </Link>
            <Link href="/status" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-900 hover:bg-slate-50 rounded-lg transition-colors">
              ติดตามสถานะ
            </Link>
          </div>

          {/* --- RIGHT: SEARCH & CART --- */}
          <div className="flex items-center gap-3 flex-1 md:flex-none justify-end">
            
            {/* Search Bar (ย่อขยายได้) */}
            <div className="relative group w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 text-sm"
                placeholder="ค้นหาอุปกรณ์..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

            {/* Cart Button */}
            <button
              onClick={onCartClick}
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
            
            {/* Profile Avatar (แถมให้เผื่ออนาคต) */}
            <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold border-2 border-slate-100 cursor-pointer ml-1">
              TS
            </div>
            
          </div>
        </div>
      </div>
    </nav>
  );
}