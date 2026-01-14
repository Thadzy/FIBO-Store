"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "react-hot-toast";
import AddItemModal from "@/components/AddItemModal";
import EditItemModal from "@/components/EditItemModal";
import { Item, AdminBooking } from "@/types";

/**
 * API Base URL retrieved from environment variables.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * AdminDashboard Component
 * A modernized dashboard for managing bookings and inventory.
 */
export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State management
  const [activeTab, setActiveTab] = useState<"bookings" | "inventory">("bookings");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Derived Stats for Dashboard Overview
  const pendingCount = bookings.filter(b => b.status === "Pending").length;
  const lowStockCount = items.filter(i => i.available_quantity < 5).length;

  /**
   * Effect: Authentication Check
   */
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || session?.user?.role !== "admin") {
      router.replace("/");
    }
  }, [status, session, router]);

  /**
   * Data Fetching Logic
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both endpoints initially to populate stats, or optimize based on tab
      const [bookingsRes, itemsRes] = await Promise.all([
        fetch(`${API_URL}/admin/bookings`),
        fetch(`${API_URL}/items`)
      ]);

      if (!bookingsRes.ok || !itemsRes.ok) throw new Error("Failed to fetch data");

      const bookingsData = await bookingsRes.json();
      const itemsData = await itemsRes.json();

      setBookings(bookingsData);
      setItems(itemsData);

    } catch (error) {
      console.error(error);
      toast.error("Failed to sync dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchData();
    }
  }, [status, session, fetchData]);

  /**
   * Action Handlers
   */
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    if (!confirm(`Update status to "${newStatus}"?`)) return;

    const promise = fetch(`${API_URL}/bookings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).then(async (res) => {
      if (!res.ok) throw new Error();
      return res.json();
    });

    await toast.promise(promise, {
      loading: 'Updating...',
      success: 'Status updated.',
      error: 'Update failed.',
    });
    fetchData();
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Permanently delete this item?")) return;

    try {
      const res = await fetch(`${API_URL}/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Item deleted.");
      fetchData();
    } catch (error) {
      toast.error("Cannot delete booked items.");
    }
  };

  /**
   * UI Helper: Status Badge
   */
  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string, icon: JSX.Element }> = {
      Pending: {
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: (
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        )
      },
      Approved: {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
      },
      Rejected: {
        color: "bg-red-50 text-red-600 border-red-100",
        icon: <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
      },
      Returned: {
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
      },
    };

    const style = config[status] || config["Pending"];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.color}`}>
        {style.icon}
        {status}
      </span>
    );
  };

  if (status === "loading") return <div className="flex h-screen justify-center items-center text-slate-400">Loading Dashboard...</div>;
  if (session?.user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-right" />

      {/* --- Top Navigation --- */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-1.5 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Admin Console</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FIBO STORE MANAGEMENT</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
              title="Refresh Data"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <Link href="/" className="bg-white border border-slate-200 text-slate-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-50 hover:text-orange-600 transition-colors shadow-sm">
              View Storefront
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">

        {/* --- Dashboard Stats Overview --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Requests</p>
              <p className="text-2xl font-black text-slate-800">{pendingCount}</p>
            </div>
            <div className={`p-3 rounded-lg ${pendingCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Low Stock Items</p>
              <p className="text-2xl font-black text-slate-800">{lowStockCount}</p>
            </div>
            <div className={`p-3 rounded-lg ${lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-xl shadow-sm flex items-center justify-between text-white">
            <div>
              <p className="text-sm font-medium text-blue-100">Total Inventory</p>
              <p className="text-2xl font-black">{items.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/10">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* --- Tab Control --- */}
        <div className="flex justify-between items-center">
          <div className="bg-slate-200/50 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "bookings" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Requests
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "inventory" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Inventory
            </button>
          </div>

          {activeTab === "inventory" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          )}
        </div>

        {/* --- Main Data Table Card --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-96 text-slate-400 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm font-medium">Synchronizing Data...</p>
            </div>
          ) : (
            <>
              {/* ---------------- View 1: Bookings ---------------- */}
              {activeTab === "bookings" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 w-24">ID</th>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Equipment</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.length > 0 ? (
                        bookings.map((b) => (
                          <tr key={b.booking_id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-400 font-medium">#{b.booking_id}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                  {b.user_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{b.user_name}</p>
                                  <p className="text-xs text-slate-400 truncate max-w-[200px]" title={b.purpose}>
                                    {b.purpose}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                {b.items.map((item, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-2 text-slate-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                    {item.name} <span className="text-xs bg-slate-100 px-1.5 rounded border border-slate-200 font-bold">x{item.quantity}</span>
                                  </span>
                                ))}
                              </div>
                              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  {b.pickup_date}
                                </span>
                                <span className="flex items-center gap-1 text-red-400">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  {b.return_date}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(b.status)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {b.status === "Pending" && (
                                  <>
                                    <button
                                      onClick={() => handleStatusUpdate(b.booking_id, "Approved")}
                                      className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                      title="Approve Request"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(b.booking_id, "Rejected")}
                                      className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
                                      title="Reject Request"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                  </>
                                )}
                                {b.status === "Approved" && (
                                  <button
                                    onClick={() => handleStatusUpdate(b.booking_id, "Returned")}
                                    className="px-3 py-1.5 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors flex items-center gap-2"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                    Mark Returned
                                  </button>
                                )}
                                {["Rejected", "Returned"].includes(b.status) && (
                                  <span className="text-slate-300 text-xs italic py-2 px-3 border border-transparent">Archived</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-20">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                              <p>No booking requests found.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ---------------- View 2: Inventory ---------------- */}
              {activeTab === "inventory" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 w-20">ID</th>
                        <th className="px-6 py-4 w-24">Image</th>
                        <th className="px-6 py-4">Item Details</th>
                        <th className="px-6 py-4">Availability</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.length > 0 ? (
                        items.map((item) => (
                          <tr key={item.item_id} className="hover:bg-slate-50/80 group transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-400">#{item.item_id}</td>
                            <td className="px-6 py-4">
                              <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-1">
                                <img src={item.image_url || "https://placehold.co/50"} alt="" className="w-full h-full object-contain" />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800 text-base">{item.name}</p>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 mt-1">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${item.available_quantity > 5 ? 'bg-green-500' : item.available_quantity > 0 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                                <span className={`font-bold ${item.available_quantity === 0 ? "text-red-500" : "text-slate-700"}`}>
                                  {item.available_quantity}
                                </span>
                                <span className="text-xs text-slate-400">{item.specifications?.unit || "pcs"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setEditingItem(item)}
                                  className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 border border-amber-200 transition-colors"
                                  title="Edit Item"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.item_id)}
                                  className="p-2 text-red-600 bg-white rounded-lg hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors"
                                  title="Delete Item"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-20">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                              <p>No items in inventory.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => { fetchData(); toast.success("Item added successfully."); }}
      />

      <EditItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSuccess={() => { fetchData(); toast.success("Item updated successfully."); }}
      />
    </div>
  );
}