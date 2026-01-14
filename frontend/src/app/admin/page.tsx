"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "react-hot-toast";
import AddItemModal from "@/components/AddItemModal";
import EditItemModal from "@/components/EditItemModal";
import { Item, AdminBooking } from "@/types";

// ✅ FIX: Environment Variable
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"bookings" | "inventory">("bookings");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    // ✅ FIX: Removed 'as any' casting
    if (status === "unauthenticated" || session?.user?.role !== "admin") {
      router.replace("/");
    }
  }, [status, session, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "bookings") {
        const res = await fetch(`${API_URL}/admin/bookings`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setBookings(data);
      } else {
        const res = await fetch(`${API_URL}/items`);
        if (!res.ok) throw new Error("Failed");
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
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchData();
    }
  }, [status, session, fetchData]);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    if (!confirm(`Confirm update status to "${newStatus}"?`)) return;
    const promise = fetch(`${API_URL}/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
    }).then(async (res) => { if (!res.ok) throw new Error(); return res.json(); });
    
    await toast.promise(promise, { loading: 'Updating...', success: 'Updated!', error: 'Failed' });
    fetchData();
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("⚠️ Are you sure?")) return;
    try {
      const res = await fetch(`${API_URL}/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted!");
      fetchData();
    } catch (error) {
      toast.error("Failed (Item might be booked)");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Approved: "bg-blue-100 text-blue-800 border-blue-200",
      Rejected: "bg-red-100 text-red-800 border-red-200",
      Returned: "bg-green-100 text-green-800 border-green-200",
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>{status}</span>;
  };

  if (status === "loading") return <div className="flex h-screen justify-center items-center text-slate-400">Loading...</div>;
  if (session?.user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-slate-100 text-blue-900">
      <Toaster position="top-right" />
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">FIBO ADMIN <span className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded">Console</span></h1>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <Link href="/" className="text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors">Back Home</Link>
        </div>
        <div className="flex gap-3">
          {activeTab === "inventory" && <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-md">+ Add Item</button>}
          <button onClick={fetchData} className="text-sm text-slate-500 hover:text-blue-600 font-bold border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">↻ Refresh</button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-6">
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-6 w-fit">
          <button onClick={() => setActiveTab("bookings")} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === "bookings" ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-50"}`}>📋 Requests</button>
          <button onClick={() => setActiveTab("inventory")} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === "inventory" ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-50"}`}>📦 Inventory</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          {loading ? <div className="flex justify-center items-center h-64 text-slate-400">Loading data...</div> : (
             <>
                {activeTab === "bookings" && (
                    <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200"><tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Items</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-center">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{bookings.map((b) => (<tr key={b.booking_id} className="hover:bg-slate-50"><td className="px-6 py-4 font-mono text-slate-400">#{b.booking_id}</td><td className="px-6 py-4"><p className="font-bold text-slate-700">{b.user_name}</p><p className="text-xs text-slate-400 truncate w-48">{b.purpose}</p></td><td className="px-6 py-4"><ul className="space-y-1 text-sm">{b.items.map((item, i) => (<li key={i}>• {item.name} <b>x{item.quantity}</b></li>))}</ul></td><td className="px-6 py-4">{getStatusBadge(b.status)}</td><td className="px-6 py-4"><div className="flex justify-center gap-2">{b.status === "Pending" && (<><button onClick={() => handleStatusUpdate(b.booking_id, "Approved")} className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded border border-emerald-200 text-xs font-bold">✅</button><button onClick={() => handleStatusUpdate(b.booking_id, "Rejected")} className="text-red-600 bg-red-50 px-3 py-1 rounded border border-red-200 text-xs font-bold">❌</button></>)}{b.status === "Approved" && <button onClick={() => handleStatusUpdate(b.booking_id, "Returned")} className="text-blue-600 bg-blue-50 px-3 py-1 rounded border border-blue-200 text-xs font-bold">↩️ Return</button>}</div></td></tr>))}</tbody></table></div>
                )}
                {activeTab === "inventory" && (
                    <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200"><tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Image</th><th className="px-6 py-4">Name</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4 text-center">Manage</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => (<tr key={item.item_id} className="hover:bg-slate-50"><td className="px-6 py-4 font-mono text-slate-400">#{item.item_id}</td><td className="px-6 py-4"><div className="w-10 h-10 bg-white rounded border border-slate-200 p-0.5"><img src={item.image_url} className="w-full h-full object-contain"/></div></td><td className="px-6 py-4 font-bold text-slate-700">{item.name}<div className="text-xs text-slate-400 font-normal">{item.category}</div></td><td className="px-6 py-4 font-bold">{item.available_quantity}</td><td className="px-6 py-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => setEditingItem(item)} className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded border border-amber-200 text-xs font-bold">Edit</button><button onClick={() => handleDeleteItem(item.item_id)} className="bg-white text-slate-400 px-3 py-1.5 rounded border border-slate-200 hover:text-red-600 text-xs font-bold">Delete</button></div></td></tr>))}</tbody></table></div>
                )}
             </>
          )}
        </div>
      </main>
      <AddItemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={() => { fetchData(); toast.success("Item added!"); }} />
      <EditItemModal isOpen={!!editingItem} onClose={() => setEditingItem(null)} item={editingItem} onSuccess={() => { fetchData(); toast.success("Item updated!"); }} />
    </div>
  );
}