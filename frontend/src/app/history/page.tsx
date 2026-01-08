"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface HistoryItem {
  name: string;
  quantity: number;
}

interface BookingHistory {
  booking_id: number;
  status: string;
  pickup_date: string;
  return_date: string;
  purpose: string;
  items: HistoryItem[];
}

export default function HistoryPage() {
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // ดึงข้อมูลประวัติ (Hardcode User ID = 1 ไว้ก่อน)
    const fetchHistory = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/my-bookings/1");
        if (!res.ok) throw new Error("Failed to fetch history");
        const data = await res.json();
        setHistory(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // ฟังก์ชันเลือกสีป้ายสถานะ
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
            อนุมัติแล้ว ✅
          </span>
        );
      case "Rejected":
        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
            ไม่อนุมัติ ❌
          </span>
        );
      case "Pending":
      default:
        return (
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
            รออนุมัติ ⏳
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        cartCount={0}
        onCartClick={() => {}}
        searchTerm=""
        onSearchChange={() => {}}
      />

      <main className="max-w-4xl mx-auto p-6 md:p-10">
        <h1 className="text-3xl font-black text-blue-900 mb-2">
          📜 ประวัติการเบิกอุปกรณ์
        </h1>
        <p className="text-slate-500 mb-8">รายการคำขอทั้งหมดของคุณ</p>

        {loading ? (
          <p className="text-center text-slate-400 mt-10">Loading history...</p>
        ) : history.length === 0 ? (
          <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-4xl block mb-4">📭</span>
            <p className="text-slate-500 mb-4">คุณยังไม่มีประวัติการเบิก</p>
            <Link
              href="/"
              className="text-orange-500 font-bold hover:underline"
            >
              กลับไปเลือกอุปกรณ์
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((booking) => (
              <div
                key={booking.booking_id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header ของ Card */}
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 text-sm">
                      #{booking.booking_id}
                    </span>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    📅 รับของ: {booking.pickup_date} | คืน:{" "}
                    {booking.return_date}
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      วัตถุประสงค์
                    </p>
                    <p className="text-slate-700 text-sm font-medium">
                      {booking.purpose}
                    </p>
                  </div>

                  <div className="bg-blue-50/30 rounded-lg p-4 border border-blue-50">
                    <p className="text-xs font-bold text-blue-900 mb-3 flex items-center gap-2">
                      📦 รายการอุปกรณ์
                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                        {booking.items.length} รายการ
                      </span>
                    </p>
                    <ul className="space-y-2">
                      {booking.items.map((item, index) => (
                        <li
                          key={index}
                          className="flex justify-between text-sm text-slate-600 border-b border-blue-100/50 last:border-0 pb-2 last:pb-0"
                        >
                          <span>• {item.name}</span>
                          <span className="font-bold text-slate-800">
                            x{item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
