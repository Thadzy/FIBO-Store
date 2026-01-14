"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

/**
 * Represents a single item within a booking history record.
 */
interface HistoryItem {
  name: string;
  quantity: number;
}

/**
 * Represents the structure of a booking history record fetched from the API.
 */
interface BookingHistory {
  booking_id: number;
  status: string;
  pickup_date: string;
  return_date: string;
  purpose: string;
  items: HistoryItem[];
}

/**
 * Base API URL from environment variables.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * HistoryPage Component
 * Displays a list of past booking requests for the authenticated user.
 */
export default function HistoryPage() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Effect: Fetch User History
   * Retrieves booking history when the user session is active.
   */
  useEffect(() => {
    const fetchHistory = async () => {
      // Ensure user is authenticated before fetching
      if (!session?.user?.email) return;

      try {
        const res = await fetch(`${API_URL}/my-bookings?email=${session.user.email}`);

        if (!res.ok) {
          throw new Error("Failed to fetch history data");
        }

        const data = await res.json();
        setHistory(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [session]);

  /**
   * Generates a status badge with appropriate colors and icons based on the booking status.
   * @param status - The status string from the database (e.g., 'Approved', 'Rejected').
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Rejected
          </span>
        );
      case "Returned":
        return (
          <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Returned
          </span>
        );
      case "Pending":
      default:
        return (
          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        cartCount={0}
        onCartClick={() => { }}
        searchTerm=""
        onSearchChange={() => { }}
      />

      <main className="max-w-4xl mx-auto p-6 md:p-10">
        <h1 className="text-3xl font-black text-blue-900 mb-2">
          Requisition History
        </h1>
        <p className="text-slate-500 mb-8">View your past equipment requests.</p>

        {loading && !history.length ? (
          <p className="text-center text-slate-400 mt-10">
            {session ? "Loading history..." : "Please sign in to view history"}
          </p>
        ) : history.length === 0 ? (
          <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
            {/* Empty State Icon */}
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-slate-500 mb-4 font-medium">No requisition history found.</p>
            <Link
              href="/"
              className="text-orange-500 font-bold hover:underline text-sm"
            >
              Back to Browse Items
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((booking) => (
              <div
                key={booking.booking_id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* Booking Header */}
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 text-sm font-semibold">
                      #{booking.booking_id}
                    </span>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Pickup: {booking.pickup_date} | Return: {booking.return_date}
                  </div>
                </div>

                {/* Booking Details */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Purpose
                    </p>
                    <p className="text-slate-700 text-sm font-medium">
                      {booking.purpose}
                    </p>
                  </div>

                  {/* Items List */}
                  <div className="bg-blue-50/30 rounded-lg p-4 border border-blue-50">
                    <p className="text-[10px] font-bold text-blue-900 mb-3 flex items-center gap-2">
                      Equipment List
                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                        {booking.items.length} Items
                      </span>
                    </p>
                    <ul className="space-y-2">
                      {booking.items.map((item, index) => (
                        <li
                          key={index}
                          className="flex justify-between text-sm text-slate-600 border-b border-blue-100/50 last:border-0 pb-2 last:pb-0"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                            {item.name}
                          </span>
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