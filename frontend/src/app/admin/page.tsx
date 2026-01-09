"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "react-hot-toast";

// Components (ที่มีอยู่แล้ว)
import AddItemModal from "@/components/AddItemModal";
import EditItemModal from "@/components/EditItemModal";

// Type (นำเข้าจากไฟล์กลาง)
import { Item } from "@/types";

// ✅ Define Type for AdminBooking (ประกาศตรงนี้เลย หรือย้ายไป types/index.ts ก็ได้)
interface AdminBooking {
  booking_id: number;
  user_name: string;
  status: string;
  pickup_date: string;
  return_date: string;
  purpose: string;
  items: {
    name: string;
    quantity: number;
  }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- States ---
  const [activeTab, setActiveTab] = useState<"bookings" | "inventory">("bookings");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // --- Security Check ---
  useEffect(() => {
    if (status === "loading") return;
    
    // ใช้ as any เพื่อความชัวร์ถ้ายังไม่ได้แก้ Type ใน next-auth.d.ts
    if (status === "unauthenticated" || (session?.user as any)?.role !== "admin") {
      // toast.error("⛔️ Access Denied");
      router.replace("/");
    }
  }, [status, session, router]);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "bookings") {
        const res = await fetch(`${API_URL}/admin/bookings`);
        if (!res.ok) throw new Error("Failed to fetch bookings");
        const data = await res.json();
        setBookings(data);
      } else {
        const res = await fetch(`${API_URL}/items`);
        if (!res.ok) throw new Error("Failed to fetch items");
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    // โหลดข้อมูลเฉพาะตอนเป็น Admin แล้วเท่านั้น
    if (status === "authenticated" && (session?.user as any)?.role === "admin") {
      fetchData();
    }
  }, [status, session, fetchData]);

  // --- Actions ---
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    const confirmMsg = `Confirm update status to "${newStatus}"?`;
    if (!confirm(confirmMsg)) return;

    const promise = fetch(`${API_URL}/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
    }).then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
    });

    await toast.promise(promise, {
        loading: 'Updating...',
        success: 'Status updated!',
        error: 'Update failed',
    });
    
    fetchData(); // Reload data
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("⚠️ Are you sure you want to delete this item?")) return;
    
    try {
      const res = await fetch(`${API_URL}/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Item deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete item (It might be booked)");
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
      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${styles[status] || "bg-gray-100"}`}>
        {status}
      </span>
    );
  };

  // Loading Screen
  if (status === "loading") return <div className="flex h-screen justify-center items-center text-slate-400">Loading...</div>;
  if ((session?.user as any)?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-slate-100 text-blue-900">
      <Toaster position="top-right" />
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            FIBO ADMIN <span className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded">Console</span>
          </h1>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <Link href="/" className="text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors">
            Back Home
          </Link>
        </div>
        <div className="flex gap-3">
          {activeTab === "inventory" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              + Add Item
            </button>
          )}
          <button
            onClick={fetchData}
            className="text-sm text-slate-500 hover:text-blue-600 font-bold border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            ↻ Refresh
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* Tab Switcher */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-6 w-fit">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "bookings" ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            📋 Booking Requests
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "inventory" ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            📦 Inventory Management
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          
          {loading ? (
             <div className="flex justify-center items-center h-64 text-slate-400">Loading data...</div>
          ) : (
             <>
                {/* ---------------- View 1: Bookings Table ---------------- */}
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
                        {bookings.length > 0 ? (
                            bookings.map((b) => (
                            <tr key={b.booking_id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-400">#{b.booking_id}</td>
                                <td className="px-6 py-4">
                                <p className="font-bold text-slate-700">{b.user_name}</p>
                                <p className="text-xs text-slate-400 truncate w-48" title={b.purpose}>{b.purpose}</p>
                                </td>
                                <td className="px-6 py-4">
                                <ul className="space-y-1 text-sm">
                                    {b.items.map((item, idx) => (
                                    <li key={idx} className="text-slate-600">
                                        • {item.name} <span className="font-bold">x{item.quantity}</span>
                                    </li>
                                    ))}
                                </ul>
                                <div className="mt-2 text-xs text-slate-500">
                                    <span className="mr-2">Pick: {b.pickup_date}</span>
                                    <span className="text-red-500">Return: {b.return_date}</span>
                                </div>
                                </td>
                                <td className="px-6 py-4">{getStatusBadge(b.status)}</td>
                                <td className="px-6 py-4">
                                <div className="flex justify-center gap-2">
                                    {b.status === "Pending" && (
                                    <>
                                        <button onClick={() => handleStatusUpdate(b.booking_id, "Approved")} className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded hover:bg-emerald-100 text-xs font-bold border border-emerald-200">
                                        ✅ Approve
                                        </button>
                                        <button onClick={() => handleStatusUpdate(b.booking_id, "Rejected")} className="text-red-600 bg-red-50 px-3 py-1 rounded hover:bg-red-100 text-xs font-bold border border-red-200">
                                        ❌ Reject
                                        </button>
                                    </>
                                    )}
                                    {b.status === "Approved" && (
                                    <button onClick={() => handleStatusUpdate(b.booking_id, "Returned")} className="text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 text-xs font-bold border border-blue-200">
                                        ↩️ Returned
                                    </button>
                                    )}
                                    {["Rejected", "Returned"].includes(b.status) && (
                                    <span className="text-slate-300 text-xs italic">- Closed -</span>
                                    )}
                                </div>
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="text-center py-10 text-slate-400">📭 No booking requests</td></tr>
                        )}
                        </tbody>
                    </table>
                    </div>
                )}

                {/* ---------------- View 2: Inventory Table ---------------- */}
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
                        {items.length > 0 ? (
                            items.map((item) => (
                            <tr key={item.item_id} className="hover:bg-slate-50 group transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-400">#{item.item_id}</td>
                                <td className="px-6 py-4">
                                <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-0.5">
                                    <img src={item.image_url || "https://placehold.co/50"} alt="" className="w-full h-full object-contain" />
                                </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-700">
                                {item.name}
                                <div className="text-xs text-slate-400 font-normal">{item.category}</div>
                                </td>
                                <td className="px-6 py-4">
                                <span className={`font-bold ${item.available_quantity === 0 ? "text-red-500" : "text-green-600"}`}>
                                    {item.available_quantity}
                                </span>
                                <span className="text-xs text-slate-400 ml-1">{item.specifications?.unit || "pcs"}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => setEditingItem(item)} className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 text-xs font-bold shadow-sm">
                                    Edit
                                    </button>
                                    <button onClick={() => handleDeleteItem(item.item_id)} className="bg-white text-slate-400 px-3 py-1.5 rounded-lg border border-slate-200 hover:text-red-600 hover:bg-red-50 text-xs font-bold shadow-sm">
                                    Delete
                                    </button>
                                </div>
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="text-center py-10 text-slate-400">📦 No items found</td></tr>
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
        onSuccess={() => { fetchData(); toast.success("Item added!"); }}
      />

      <EditItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSuccess={() => { fetchData(); toast.success("Item updated!"); }}
      />
    </div>
  );
}