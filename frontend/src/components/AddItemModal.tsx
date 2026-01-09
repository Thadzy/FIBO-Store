"use client";
import React, { useState } from "react";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddItemModal({ isOpen, onClose, onSuccess }: AddItemModalProps) {
  const [loading, setLoading] = useState(false);
  // เก็บข้อมูล Text
  const [formData, setFormData] = useState({
    name: "",
    category: "General",
    description: "",
    quantity: 1,
    unit: "pcs",
    // image_url ไม่ต้องใช้แล้ว
  });
  // ✅ เก็บไฟล์ที่เลือก
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  // ฟังก์ชันจัดการเมื่อเลือกไฟล์
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
        alert("กรุณาเลือกรูปภาพด้วยครับ");
        return;
    }
    setLoading(true);

    try {
      // ✅ สร้าง FormData (สำหรับส่งไฟล์ + ข้อความ)
      const data = new FormData();
      data.append("name", formData.name);
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("quantity", formData.quantity.toString()); // FormData รับแต่ string
      data.append("unit", formData.unit);
      // ⚠️ สำคัญมาก: ชื่อ key "image_file" ต้องตรงกับที่ Backend รับ
      data.append("image_file", selectedFile); 

      // ส่งข้อมูลไปหา Backend
      const res = await fetch("http://127.0.0.1:8000/items", {
        method: "POST",
        // ⚠️ ไม่ต้องใส่ header "Content-Type": "application/json" แล้ว
        // Browser จะจัดการ boundary ของ multipart/form-data ให้เอง
        body: data, 
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to add item");
      }

      alert("✅ เพิ่มอุปกรณ์และอัปโหลดรูปภาพสำเร็จ!");
      onSuccess();
      onClose();
      // Reset Form
      setFormData({ name: "", category: "General", description: "", quantity: 1, unit: "pcs" });
      setSelectedFile(null);

    } catch (error) {
      alert("❌ เกิดข้อผิดพลาด: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-blue-900">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">✨ เพิ่มอุปกรณ์ใหม่ (พร้อมรูปภาพ)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ... (ช่อง Name, Category, Unit, Quantity เหมือนเดิม) ... */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">ชื่ออุปกรณ์</label>
            <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
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
               <input type="text" className="w-full p-2 border border-slate-300 rounded-lg outline-none" placeholder="เช่น pcs"
                  value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}/>
            </div>
          </div>
          <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">จำนวนตั้งต้น</label>
                <input required type="number" min="1" className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}/>
          </div>

          {/* ✅ เปลี่ยนช่องกรอก URL เป็น Input File */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">รูปภาพอุปกรณ์</label>
            <input 
              required
              type="file" 
              accept="image/png, image/jpeg, image/webp" // รับเฉพาะไฟล์รูป
              className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={handleFileChange}
            />
            {selectedFile && (
                <p className="text-xs text-green-600 mt-1">✅ เลือกไฟล์: {selectedFile.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">รายละเอียด</label>
            <textarea rows={3} className="w-full p-2 border border-slate-300 rounded-lg outline-none resize-none" placeholder="รายละเอียดเพิ่มเติม..."
              value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}/>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:bg-slate-300 disabled:shadow-none">
            {loading ? "กำลังอัปโหลด..." : "ยืนยันการเพิ่มอุปกรณ์"}
          </button>
        </form>
      </div>
    </div>
  );
}