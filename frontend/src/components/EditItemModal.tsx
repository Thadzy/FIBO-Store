"use client";
import React, { useState, useEffect } from "react";
import { Item } from "@/types"; // อย่าลืมสร้าง/เช็ค type นี้

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: Item | null; // รับข้อมูลของที่จะแก้
}

export default function EditItemModal({ isOpen, onClose, onSuccess, item }: EditItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "General",
    description: "",
    quantity: 1,
    unit: "pcs",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ✅ เมื่อเปิด Modal ให้ดึงข้อมูล item เดิมมาใส่ฟอร์ม
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category || "General",
        description: item.description || "",
        quantity: item.available_quantity,
        unit: item.specifications?.unit || "pcs",
      });
      setSelectedFile(null); // Reset ไฟล์ใหม่เสมอ
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("quantity", formData.quantity.toString());
      data.append("unit", formData.unit);
      
      // ถ้าเลือกไฟล์ใหม่ค่อยส่งไป
      if (selectedFile) {
        data.append("image_file", selectedFile);
      }

      // ⚠️ เปลี่ยนเป็น PUT และส่งไปที่ item_id เฉพาะ
      const res = await fetch(`http://127.0.0.1:8000/items/${item.item_id}`, {
        method: "PUT",
        body: data,
      });

      if (!res.ok) throw new Error("Update failed");

      alert("✅ แก้ไขข้อมูลสำเร็จ!");
      onSuccess();
      onClose();
    } catch (error) {
      alert("❌ เกิดข้อผิดพลาด: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-orange-800">✏️ แก้ไขอุปกรณ์: {item.item_id}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">ชื่ออุปกรณ์</label>
            <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg"
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          
          {/* ... (Copy ส่วน Category, Unit, Qty, Description จาก AddItemModal มาใส่ตรงนี้ได้เลย) ... */}
          {/* เพื่อความกระชับ ผมย่อส่วนนี้ไว้ แต่คุณใช้โค้ด UI เดียวกับ AddItemModal ได้เลยครับ */}
             <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">หมวดหมู่</label>
              <select className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                <option value="General">General</option>
                <option value="Electronics">Electronics</option>
                <option value="Sensors">Sensors</option>
                <option value="Tools">Tools</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">หน่วยนับ</label>
               <input type="text" className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}/>
            </div>
          </div>
          <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">จำนวนคงเหลือ</label>
                <input required type="number" min="0" className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}/>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">รูปภาพใหม่ (ไม่ต้องเลือกถ้าใช้รูปเดิม)</label>
            <input type="file" accept="image/*"
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
            />
          </div>

          <div>
             <label className="block text-sm font-bold text-slate-700 mb-1">รายละเอียด</label>
             <textarea rows={3} className="w-full p-2 border border-slate-300 rounded-lg outline-none resize-none"
               value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}/>
           </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all disabled:bg-slate-300">
            {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
        </form>
      </div>
    </div>
  );
}