import React from "react";
import { Item } from "@/types";

interface ItemCardProps {
  item: Item;
  onAddToCart: (item: Item) => void;
}

export default function ItemCard({ item, onAddToCart }: ItemCardProps) {
  // 1. กำหนด Image URL
  const imageUrl =
    item.image_url || "https://placehold.co/400x300?text=No+Image";

  // 2. คำนวณสถานะสินค้า (ประกาศตัวแปร isAvailable ตรงนี้)
  const isAvailable = item.available_quantity > 0;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 p-4 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
      {/* Decorative Background Accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-100 to-transparent rounded-bl-full -z-0 opacity-50 group-hover:from-orange-50 transition-colors"></div>

      {/* --- Image Area --- */}
      <div className="relative h-48 w-full bg-slate-50 overflow-hidden rounded-xl mb-4 border border-slate-100 group-hover:border-orange-200 transition-colors">
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://placehold.co/400x300?text=Image+Error";
          }}
        />

        {/* Stock Label Overlay */}
        <div className="absolute bottom-2 right-2">
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-md border shadow-sm ${
              isAvailable
                ? "bg-white/90 text-green-600 border-green-200 backdrop-blur-sm"
                : "bg-red-50 text-red-500 border-red-100"
            }`}
          >
            {isAvailable
              ? `${item.available_quantity} IN STOCK`
              : "OUT OF STOCK"}
          </span>
        </div>
      </div>

      {/* --- Content Area --- */}
      <div className="flex-1 flex flex-col z-10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-900 transition-colors line-clamp-1">
              {item.name}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1">
              {/* เปลี่ยนจาก location เป็น category เนื่องจาก DB ไม่มี location */}
              📂 {item.category || "General"}
            </p>
          </div>
        </div>

        {/* Tech Specs Box */}
        <div className="bg-slate-50 rounded-lg p-2.5 mb-4 border border-slate-100/50">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Specifications
          </p>
          <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px]">
            {Object.entries(item.specifications || {}).length > 0 ? (
              Object.entries(item.specifications || {})
                .slice(0, 4)
                .map(([key, val]: any) => (
                  <div
                    key={key}
                    className="flex flex-col border-l-2 border-slate-200 pl-2"
                  >
                    <span className="text-slate-400 text-[9px] capitalize leading-none">
                      {key}
                    </span>

                    {/* 👇 แก้ตรงนี้: ใส่ String() ครอบ val ไว้หน่อยครับ เพื่อความชัวร์ */}
                    <span className="font-semibold text-slate-700 truncate">
                      {typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val)}
                    </span>
                  </div>
                ))
            ) : (
              <span className="text-slate-300 text-xs italic col-span-2">
                - No specs available -
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onAddToCart(item)}
          disabled={!isAvailable}
          className={`mt-auto w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            isAvailable
              ? "bg-blue-900 text-white hover:bg-orange-500 shadow-md shadow-slate-200 hover:shadow-orange-200 active:scale-95"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isAvailable ? (
            <>
              <span>Add to Cart</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </>
          ) : (
            "Unavailable"
          )}
        </button>
      </div>
    </div>
  );
}
