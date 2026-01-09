// src/services/adminService.ts
import { AdminBooking, Item } from "@/types"; // Import จากไฟล์ที่คุณมี

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchBookings = async (): Promise<AdminBooking[]> => {
  const res = await fetch(`${API_URL}/admin/bookings`);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
};

export const fetchItems = async (): Promise<Item[]> => {
  const res = await fetch(`${API_URL}/items`);
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
};

export const updateBookingStatus = async (id: number, status: string) => {
  const res = await fetch(`${API_URL}/bookings/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
};

export const deleteItem = async (id: number) => {
  const res = await fetch(`${API_URL}/items/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete item");
  return true;
};