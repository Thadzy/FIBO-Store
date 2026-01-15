"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

/**
 * Interface representing a single item within a booking.
 */
interface HistoryItem {
  name: string;
  quantity: number;
}

/**
 * Interface representing the structure of a booking transaction.
 * Includes status, dates, purpose, and the list of associated items.
 */
interface Booking {
  booking_id: number;
  status: string;
  pickup_date: string;
  return_date: string;
  purpose: string;
  items: HistoryItem[];
}

// Base API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * ActiveLoansPage Component
 * * Displays a list of equipment currently borrowed by the authenticated user.
 * It filters bookings to show only those with an "Approved" status, 
 * indicating the items are currently in possession of the user.
 */
export default function ActiveLoansPage() {
  // Retrieve the current user session
  const { data: session } = useSession();

  // State management for booking data and loading status
  const [activeLoans, setActiveLoans] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Effect to fetch booking history from the API.
   * Runs whenever the session data changes.
   */
  useEffect(() => {
    const fetchActiveLoans = async () => {
      // Ensure the user is logged in before making the request
      if (!session?.user?.email) return;

      try {
        const res = await fetch(`${API_URL}/my-bookings?email=${session.user.email}`);
        
        if (!res.ok) {
            throw new Error("Failed to fetch data");
        }

        const data = await res.json();
        
        /**
         * Filter logic to isolate Active Loans:
         * - "Pending": Request made but items not picked up.
         * - "Approved": Items currently with the student (Active).
         * - "Returned": Transaction completed.
         */
        const active = data.filter((b: Booking) => b.status === "Approved");
        
        setActiveLoans(active);
      } catch (error) {
        console.error("Error fetching active loans:", error);
      } finally {
        // Ensure loading state is disabled regardless of success or failure
        setLoading(false);
      }
    };

    fetchActiveLoans();
  }, [session]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <Navbar cartCount={0} onCartClick={() => {}} searchTerm="" onSearchChange={() => {}} />

      <main className="max-w-4xl mx-auto p-6 md:p-10">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-black text-blue-900 mb-1">
                Active Borrowings
                </h1>
                <p className="text-slate-500">Items currently in your possession.</p>
            </div>
            {/* Link to full history (includes returned and pending items) */}
            <Link href="/history" className="text-sm font-bold text-slate-400 hover:text-blue-900 underline">
                View Full History
            </Link>
        </div>

        {/* Conditional Rendering based on State */}
        {loading ? (
          <p className="text-center text-slate-400 mt-10">Checking active loans...</p>
        ) : activeLoans.length === 0 ? (
          /* Empty State: User has no active loans */
          <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-slate-500 mb-4 font-bold">No active loans.</p>
            <p className="text-sm text-slate-400">You have returned everything!</p>
            <Link href="/" className="text-orange-500 font-bold hover:underline text-sm mt-4 block">
              Borrow new items
            </Link>
          </div>
        ) : (
          /* List of Active Loans */
          <div className="space-y-6">
            {activeLoans.map((booking) => (
              <div
                key={booking.booking_id}
                className="bg-white rounded-xl shadow-lg border-l-4 border-l-green-500 overflow-hidden"
              >
                {/* Card Header: Status and Due Date */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 animate-pulse">
                      Active
                    </span>
                    <span className="text-xs text-slate-400 font-mono">#{booking.booking_id}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Due Date</p>
                    <p className="text-sm font-bold text-red-500">{booking.return_date}</p>
                  </div>
                </div>

                {/* Card Body: Purpose and Item List */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Subject / Purpose</p>
                    <p className="font-medium text-slate-800">{booking.purpose}</p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 mb-2">Items to Return:</p>
                    <ul className="space-y-2">
                        {booking.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center border-b border-slate-200 last:border-0 pb-2 last:pb-0">
                                <span className="text-sm text-slate-700 font-medium">{item.name}</span>
                                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">x{item.quantity}</span>
                            </li>
                        ))}
                    </ul>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-xs text-slate-400 italic">
                        Show this screen to the Admin when returning items.
                    </p>
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