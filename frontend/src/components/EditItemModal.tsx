"use client";
import React, { useState, useEffect } from "react";
import { Item } from "@/types";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: Item | null;
}

interface SpecRow {
  key: string;
  value: string;
}

export default function EditItemModal({ isOpen, onClose, onSuccess, item }: EditItemModalProps) {
  const [loading, setLoading] = useState(false);
  
  // 1. State ข้อมูลพื้นฐาน
  const [formData, setFormData] = useState({
    name: "",
    category: "General",
    description: "",
    quantity: 1,
    unit: "pcs",
  });
  
  // 2. State ไฟล์
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // 3. ✅ State สำหรับ Specs (Dynamic)
  const [specs, setSpecs] = useState<SpecRow[]>([{ key: "", value: "" }]);

  // --- Effect: ดึงข้อมูลเดิมมาใส่ Form ---
  useEffect(() => {
    if (item) {
      // 1. ตั้งค่าพื้นฐาน
      setFormData({
        name: item.name,
        category: item.category || "General",
        description: item.description || "",
        quantity: item.available_quantity,
        unit: item.specifications?.unit || "pcs", // ดึง unit จาก specs เดิม
      });

      // 2. ✅ ดึง Specs เดิมมาใส่ในตาราง (ยกเว้น unit เพราะมีช่องกรอกแยกแล้ว)
      if (item.specifications) {
        const loadedSpecs: SpecRow[] = Object.entries(item.specifications)
          .filter(([key]) => key !== "unit") // กรอง unit ออก
          .map(([key, value]) => ({
            key: key,
            value: String(value), // แปลงเป็น String เสมอ
          }));

        // ถ้ามี specs เดิม ให้ใช้เลย, ถ้าไม่มี ให้เริ่มด้วยแถวว่าง 1 แถว
        setSpecs(loadedSpecs.length > 0 ? loadedSpecs : [{ key: "", value: "" }]);
      } else {
        setSpecs([{ key: "", value: "" }]);
      }

      setSelectedFile(null); // Reset ไฟล์ใหม่เสมอ
    }
  }, [item, isOpen]);

  // --- Handlers สำหรับ Specs ---
  const addSpecRow = () => {
    setSpecs([...specs, { key: "", value: "" }]);
  };

  const removeSpecRow = (index: number) => {
    const newSpecs = specs.filter((_, i) => i !== index);
    setSpecs(newSpecs);
  };

  const handleSpecChange = (index: number, field: keyof SpecRow, val: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = val;
    setSpecs(newSpecs);
  };

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ 1. เตรียม Object Specifications
      const specificationsObject = specs.reduce((acc, curr) => {
        if (curr.key.trim() !== "") {
          acc[curr.key.trim()] = curr.value.trim();
        }
        return acc;
      }, {} as Record<string, any>);

      // ✅ 2. สร้าง FormData
      const data = new FormData();
      data.append("name", formData.name);
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("quantity", formData.quantity.toString());
      data.append("unit", formData.unit);

      // ส่ง Specs เป็น JSON String (เหมือนตอน Add)
      data.append("specifications", JSON.stringify(specificationsObject));
      
      if (selectedFile) {
        data.append("image_file", selectedFile);
      }

      // ส่ง PUT Request
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-bold text-orange-800">✏️ แก้ไขอุปกรณ์: {item.item_id}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 text-xl font-bold">✕</button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Name */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ชื่ออุปกรณ์</label>
                <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-orange-500"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            
            {/* 2. Category & Unit */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">หมวดหมู่</label>
                <select className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-orange-500"
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
                <input type="text" className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-orange-500"
                    value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}/>
                </div>
            </div>

            {/* 3. Quantity */}
            <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">จำนวนคงเหลือ</label>
                    <input required type="number" min="0" className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-orange-500"
                    value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}/>
            </div>

            {/* 4. ✅ ส่วน Specifications (เหมือน AddModal แต่ธีมสีส้ม) */}
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-bold text-orange-800 flex items-center gap-2">
                        ⚙️ Specifications
                    </label>
                    <button 
                        type="button" 
                        onClick={addSpecRow}
                        className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full hover:bg-orange-200 font-bold transition-colors"
                    >
                        + เพิ่มสเปค
                    </button>
                </div>

                <div className="space-y-2">
                    {specs.map((spec, index) => (
                        <div key={index} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200">
                            <input
                                type="text"
                                placeholder="ชื่อ (เช่น rpm)"
                                className="flex-1 p-2 text-xs border border-orange-200 rounded-lg outline-none focus:border-orange-400 bg-white"
                                value={spec.key}
                                onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                            />
                            <span className="text-orange-300">:</span>
                            <input
                                type="text"
                                placeholder="ค่า (เช่น 500)"
                                className="flex-1 p-2 text-xs border border-orange-200 rounded-lg outline-none focus:border-orange-400 bg-white"
                                value={spec.value}
                                onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => removeSpecRow(index)}
                                className="text-orange-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* 5. Image File */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">รูปภาพใหม่ (ไม่ต้องเลือกถ้าใช้รูปเดิม)</label>
                <input type="file" accept="image/*"
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                />
            </div>

            {/* 6. Description */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">รายละเอียด</label>
                <textarea rows={3} className="w-full p-2 border border-slate-300 rounded-lg outline-none resize-none focus:border-orange-500"
                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}/>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all disabled:bg-slate-300 mt-4">
                {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
            </form>
        </div>
      </div>
    </div>
  );
}