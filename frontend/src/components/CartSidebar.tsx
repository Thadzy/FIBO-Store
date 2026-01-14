"use client";

import React from "react";
import { Item } from "@/types";

/**
 * Extends the base Item interface to include quantity specific to the cart.
 */
interface CartItem extends Item {
  borrow_qty: number;
}

/**
 * Props for the CartSidebar component.
 */
interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onCheckout: () => void;
  onRemoveItem: (id: number) => void;
  onIncreaseItem: (id: number) => void;
  onDecreaseItem: (id: number) => void;
}

/**
 * CartSidebar Component
 * * A slide-over sidebar that displays the selected items for requisition.
 * Allows users to adjust quantities, remove items, and proceed to checkout.
 */
export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onCheckout,
  onIncreaseItem,
  onDecreaseItem
}: CartSidebarProps) {
  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Your Requisition
            <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">
              {cartItems.length} items
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-100"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              {/* Empty State Icon */}
              <svg className="w-16 h-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="font-medium">Your requisition list is empty.</p>
              <button
                type="button"
                onClick={onClose}
                className="text-blue-600 text-sm font-bold hover:underline"
              >
                Browse components
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.item_id}
                className="flex gap-4 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-100 transition-colors"
              >
                {/* Item Image */}
                <div className="w-16 h-16 bg-slate-50 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200">
                  <img
                    src={item.image_url || "https://placehold.co/100x100?text=No+Img"}
                    alt={item.name}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Image+Error";
                    }}
                  />
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 truncate pr-2">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.item_id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Stock: {item.available_quantity} {item.specifications?.unit || 'pcs'}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        type="button"
                        onClick={() => onDecreaseItem(item.item_id)}
                        disabled={item.borrow_qty <= 1}
                        className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded-l-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-2 text-sm font-bold text-slate-800 min-w-[30px] text-center">
                        {item.borrow_qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onIncreaseItem(item.item_id)}
                        disabled={item.borrow_qty >= item.available_quantity}
                        className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded-r-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onCheckout}
            disabled={cartItems.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Confirm Requisition</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-3">
            By confirming, you agree to return items within 7 days.
          </p>
        </div>
      </div>
    </>
  );
}