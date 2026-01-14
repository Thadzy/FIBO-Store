import { AdminBooking, Item } from "@/types";

/**
 * Base API URL from environment variables.
 * Falls back to an empty string to prevent runtime crashes, 
 * though proper environment validation is recommended.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Fetches all booking requests for the admin dashboard.
 * @returns {Promise<AdminBooking[]>} A list of all bookings.
 * @throws {Error} If the network request fails.
 */
export const fetchBookings = async (): Promise<AdminBooking[]> => {
  const res = await fetch(`${API_URL}/admin/bookings`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch bookings: ${res.statusText}`);
  }
  
  return res.json();
};

/**
 * Fetches the complete inventory list.
 * @returns {Promise<Item[]>} A list of all inventory items.
 * @throws {Error} If the network request fails.
 */
export const fetchItems = async (): Promise<Item[]> => {
  const res = await fetch(`${API_URL}/items`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch inventory items: ${res.statusText}`);
  }
  
  return res.json();
};

/**
 * Updates the status of a specific booking.
 * @param id - The ID of the booking to update.
 * @param status - The new status (e.g., 'Approved', 'Rejected', 'Returned').
 * @returns {Promise<any>} The updated booking object.
 * @throws {Error} If the update operation fails.
 */
export const updateBookingStatus = async (id: number, status: string): Promise<any> => {
  const res = await fetch(`${API_URL}/bookings/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update booking status: ${res.statusText}`);
  }

  return res.json();
};

/**
 * Permanently deletes an item from the inventory.
 * @param id - The ID of the item to delete.
 * @returns {Promise<boolean>} True if deletion was successful.
 * @throws {Error} If the deletion fails (e.g., item is currently booked).
 */
export const deleteItem = async (id: number): Promise<boolean> => {
  const res = await fetch(`${API_URL}/items/${id}`, { method: "DELETE" });

  if (!res.ok) {
    throw new Error(`Failed to delete item: ${res.statusText}`);
  }

  return true;
};