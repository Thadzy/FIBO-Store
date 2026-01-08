"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react"; 
import { useRouter } from "next/navigation";   

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
  
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Security Check ---
useEffect(() => {
    // 1. ถ้ายืนยันตัวตนเสร็จแล้ว (ไม่ใช่สถานะ loading)
    if (status !== "loading") {
      
      // 2. เช็คเงื่อนไข: "ยังไม่ Login" หรือ "Login แล้วแต่ไม่ใช่ Admin"
      if (status === "unauthenticated" || session?.user?.role !== "admin") {
        
        // 3. แจ้งเตือนก่อน
        alert("⛔️ Access Denied: คุณไม่มีสิทธิ์เข้าถึงหน้านี้!");
        
        // 4. เตะกลับหน้าแรก
        router.push("/");
      }
    }
  }, [status, session, router]);

  // --- Fetch Data ---
  const fetchBookings = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/admin/bookings");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBookings(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchBookings();
    }
  }, [status, session]);

  // --- Update Status Function ---
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น "${newStatus}" ?`)) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Update failed");

      setBookings((prev) =>
        prev.map((b) =>
          b.booking_id === id ? { ...b, status: newStatus } : b
        )
      );
      
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอัปเดต");
    }
  };

  // Helper เลือกสีป้ายสถานะ
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

  if (status === "loading" || session?.user?.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Verifying access...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
          FIBO ADMIN <span className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded">Console</span>
        </h1>
        <button 
            onClick={fetchBookings} 
            className="text-sm text-blue-600 hover:underline font-bold"
        >
            Refresh Data
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">จัดการคำขอเบิกอุปกรณ์</h2>

        {loading ? (
          <p className="text-center mt-10">Loading dashboard...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((booking) => (
                    <tr key={booking.booking_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-400">#{booking.booking_id}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">{booking.user_name}</p>
                        <p className="text-xs text-slate-400 truncate w-48" title={booking.purpose}>
                           {booking.purpose}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <ul className="space-y-1">
                          {booking.items.map((item, idx) => (
                            <li key={idx} className="text-slate-600">
                              • {item.name} <span className="font-bold">x{item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="flex flex-col gap-1">
                            <span>รับ: {booking.pickup_date}</span>
                            <span className="text-red-400">คืน: {booking.return_date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {booking.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(booking.booking_id, "Approved")}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                              >
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(booking.booking_id, "Rejected")}
                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                              >
                                ปฏิเสธ
                              </button>
                            </>
                          )}

                          {booking.status === "Approved" && (
                            <button
                              onClick={() => handleStatusUpdate(booking.booking_id, "Returned")}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                            >
                               คืนของแล้ว
                            </button>
                          )}

                          {(booking.status === "Rejected" || booking.status === "Returned") && (
                            <span className="text-slate-300 text-xs">- closed -</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}