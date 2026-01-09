export interface Item {
  item_id: number;
  name: string;
  category: string;
  description?: string;
  available_quantity: number;
  image_url?: string;
  specifications: Record<string, any>;
}

// ✅ เพิ่ม Type นี้เข้าไปครับ
export interface AdminBooking {
  booking_id: number;
  user_name: string;
  status: string;
  pickup_date: string;
  return_date: string;
  purpose: string;
  items: { 
    name: string; 
    quantity: number 
  }[];
}