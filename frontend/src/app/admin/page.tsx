"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AddItemModal from "@/components/AddItemModal";
import EditItemModal from "@/components/EditItemModal";
import { Item } from "@/types";

// Types
interface AdminBooking {
  booking_id: number;
  user_name: string;
  status: string;
  pickup_date: string;
  return_date: string;
  purpose: string;
  items: { name: string; quantity: number }[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- States ---
  const [activeTab, setActiveTab] = useState<"bookings" | "inventory">(
    "bookings"
  );
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // --- Security Check ---
  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated" || session?.user?.role !== "admin") {
        alert("⛔️ Access Denied!");
        router.push("/");
      }
    }
  }, [status, session, router]);

  // --- Fetch Data Functions ---
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "bookings") {
        const res = await fetch("http://127.0.0.1:8000/admin/bookings");
        const data = await res.json();
        setBookings(data);
      } else {
        const res = await fetch("http://127.0.0.1:8000/items");
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchData();
    }
  }, [status, session, activeTab]);

  // --- Booking Actions ---
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น "${newStatus}" ?`)) return;
    try {
      await fetch(`http://127.0.0.1:8000/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (error) {
      alert("Error updating status");
    }
  };

  // --- Inventory Actions ---
  const handleDeleteItem = async (id: number) => {
    if (!confirm("⚠️ แน่ใจหรือไม่ที่จะลบอุปกรณ์นี้? (กู้คืนไม่ได้นะ)")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/items/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      alert("ลบอุปกรณ์เรียบร้อย");
      fetchData();
    } catch (error) {
      alert("ลบไม่สำเร็จ: อุปกรณ์อาจถูกจองอยู่");
    }
  };

  // --- Helper UI ---
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Approved: "bg-blue-100 text-blue-800 border-blue-200",
      Rejected: "bg-red-100 text-red-800 border-red-200",
      Returned: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-bold border ${styles[status]}`}
      >
        {status}
      </span>
    );
  };

  if (status === "loading" || (session?.user as any)?.role !== "admin")
    return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 text-blue-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            FIBO ADMIN{" "}
            <span className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded">
              Console
            </span>
          </h1>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <Link
            href="/"
            className="text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors"
          >
            Back Home
          </Link>
        </div>
        <div className="flex gap-3">
          {activeTab === "inventory" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Item
            </button>
          )}
          <button
            onClick={fetchData}
            className="text-sm text-slate-500 hover:text-blue-600 font-bold border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* Tab Switcher */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-6 w-fit">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "bookings"
                ? "bg-slate-800 text-white shadow"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            📋 Booking Requests
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "inventory"
                ? "bg-slate-800 text-white shadow"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            📦 Inventory Management
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          {/* View 1: Bookings Table */}
          {activeTab === "bookings" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* ✅ เช็คว่ามีข้อมูลไหม ถ้ามีให้วนลูปแสดง */}
                  {Array.isArray(bookings) && bookings.length > 0 ? (
                    bookings.map((b) => (
                      <tr
                        key={b.booking_id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {/* 1. ID */}
                        <td className="px-6 py-4 font-mono text-slate-400">
                          #{b.booking_id}
                        </td>

                        {/* 2. User Name */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700">
                            {b.user_name}
                          </p>
                          <p
                            className="text-xs text-slate-400 truncate w-48"
                            title={b.purpose}
                          >
                            {b.purpose}
                          </p>
                        </td>

                        {/* 3. Items List (ที่หายไป) */}
                        <td className="px-6 py-4">
                          <ul className="space-y-1 text-sm">
                            {b.items.map((item, idx) => (
                              <li
                                key={idx}
                                className="text-slate-600 flex items-center gap-1"
                              >
                                <span className="w-1 h-1 rounded-full bg-slate-400 inline-block"></span>
                                {item.name}{" "}
                                <span className="font-bold text-slate-800">
                                  x{item.quantity}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 text-xs text-slate-500">
                            <div className="flex gap-1">
                              <span>รับ:</span>{" "}
                              <span className="font-medium text-slate-700">
                                {b.pickup_date}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <span>คืน:</span>{" "}
                              <span className="font-medium text-red-500">
                                {b.return_date}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Status Badge */}
                        <td className="px-6 py-4">
                          {getStatusBadge(b.status)}
                        </td>

                        {/* 5. Actions Buttons (ปุ่มที่หายไป!) */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-2">
                            {/* ปุ่มสำหรับสถานะ Pending */}
                            {b.status === "Pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(b.booking_id, "Approved")
                                  }
                                  className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition-colors shadow-sm active:scale-95"
                                  title="Approve"
                                >
                                  ✅ Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(b.booking_id, "Rejected")
                                  }
                                  className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 font-bold text-xs hover:bg-red-100 transition-colors shadow-sm active:scale-95"
                                  title="Reject"
                                >
                                  ❌ Reject
                                </button>
                              </>
                            )}

                            {/* ปุ่มสำหรับสถานะ Approved */}
                            {b.status === "Approved" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(b.booking_id, "Returned")
                                }
                                className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 font-bold text-xs hover:bg-blue-100 transition-colors shadow-sm active:scale-95"
                              >
                                ↩️ Mark Returned
                              </button>
                            )}

                            {/* ข้อความเมื่อจบงานแล้ว */}
                            {(b.status === "Rejected" ||
                              b.status === "Returned") && (
                              <span className="text-slate-300 text-xs italic">
                                - Closed -
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // กรณีไม่มีข้อมูล หรือ Error
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-10 text-slate-400"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-2xl">📭</span>
                          <p>
                            {Array.isArray(bookings)
                              ? "ยังไม่มีรายการจองเข้ามาครับ"
                              : "โหลดข้อมูลไม่สำเร็จ กรุณากด Refresh"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* View 2: Inventory Table */}
          {activeTab === "inventory" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Image</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4 text-center">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr
                      key={item.item_id}
                      className="hover:bg-slate-50 group transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-slate-400">
                        #{item.item_id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-0.5">
                          <img
                            src={item.image_url || "https://placehold.co/50"}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {item.name}
                        <div className="text-xs text-slate-400 font-normal">
                          {item.category}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold ${
                            item.available_quantity === 0
                              ? "text-red-500"
                              : "text-green-600"
                          }`}
                        >
                          {item.available_quantity}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          {item.specifications["unit"]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {/* ✅ ปุ่ม Edit/Delete แบบใหม่ (Icon + Color) */}
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm active:scale-95 text-xs font-bold"
                            title="Edit Item"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.item_id)}
                            className="flex items-center gap-1 bg-white text-slate-400 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm active:scale-95 text-xs font-bold"
                            title="Delete Item"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchData();
          alert("เพิ่มสำเร็จ!");
        }}
      />

      <EditItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSuccess={() => {
          fetchData();
          alert("แก้ไขสำเร็จ!");
        }}
      />
    </div>
  );
}
