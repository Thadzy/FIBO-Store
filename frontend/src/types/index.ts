export interface Item {
  item_id: string; // หรือ number
  name: string;
  category: string;
  description?: string;
  available_quantity: number;
  image_url?: string;
  
  // ✅ ต้องเพิ่มบรรทัดนี้ครับ
  specifications?: Record<string, string>; 
  // หรือ: specifications?: { [key: string]: string };
}