import React from "react";

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function Header({ 
  cartCount, 
  onCartClick, 
  searchTerm, 
  onSearchChange 
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-orange-500/30 transform hover:scale-105 transition-transform duration-300">
            ⚙️
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">
              FIBO<span className="text-orange-500">STORE</span>
            </h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Inventory System
            </span>
          </div>
        </div>

        {/* Search Bar UI */}
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 sm:text-sm shadow-inner"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Cart Button UI */}
        <button
          onClick={onCartClick}
          className="relative group bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-2"
        >
          <span className="bg-slate-100 p-1.5 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
            🛒
          </span>
          <span className="text-sm">My Cart</span>
          
          {/* Badge UI */}
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-orange-500 border-2 border-white text-white text-[10px] font-bold items-center justify-center">
                {cartCount}
              </span>
            </span>
          )}
        </button>
      </div>
    </header>
  );
}