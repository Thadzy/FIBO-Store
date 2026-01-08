import React from "react";
import { Item } from "@/types";

// เพิ่ม field จำนวนลงไปใน Item เดิม
interface CartItem extends Item {
  borrow_qty: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (id: string) => void; // ให้คุณไปผูก Logic ลบของเอง
  onCheckout: () => void;             // ให้คุณไปผูก Logic ยืนยันเอง
}

export default function CartSidebar({ 
  isOpen, 
  onClose, 
  cartItems, 
  onRemoveItem,
  onCheckout 
}: CartSidebarProps) {
  return (
    <>
      {/* Backdrop (Blur Background) */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Your Requisition
            <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">{cartItems.length} items</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Item List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <span className="text-4xl opacity-50"></span>
              <p>Your cart is empty.</p>
              <button onClick={onClose} className="text-blue-600 text-sm font-semibold hover:underline">Browse components</button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.item_id} className="flex gap-4 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-100 transition-colors">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center text-xl"></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate">{item.name}</h4>
                  <p className="text-xs text-slate-500 mb-2">Unit: {item.specifications['unit'] || 'pcs'}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded text-slate-600">
                      x {item.borrow_qty}
                    </span>
                    <button 
                      onClick={() => onRemoveItem(item.item_id)}
                      className="text-xs text-red-500 font-medium hover:text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onCheckout}
            disabled={cartItems.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Confirm Requisition</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-3">
            By confirming, you agree to return items within 7 days.
          </p>
        </div>
      </div>
    </>
  );
}