"use client";
import React, { useState } from "react";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Interface สำหรับจัดการ State ของ Specifications ชั่วคราว
interface SpecRow {
  key: string;
  value: string;
}

export default function AddItemModal({ isOpen, onClose, onSuccess }: AddItemModalProps) {
  const [loading, setLoading] = useState(false);
  
  // 1. เก็บข้อมูลพื้นฐาน
  const [formData, setFormData] = useState({
    name: "",
    category: "General",
    description: "",
    quantity: 1,
    unit: "pcs",
  });

  // 2. เก็บไฟล์รูปภาพ
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 3. ✅ เก็บข้อมูล Specifications แบบ Dynamic (เริ่มด้วยแถวว่าง 1 แถว)
  const [specs, setSpecs] = useState<SpecRow[]>([{ key: "", value: "" }]);

  if (!isOpen) return null;

  // --- Handlers สำหรับจัดการไฟล์ ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- Handlers สำหรับจัดการ Specifications ---
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

  // --- Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
        alert("กรุณาเลือกรูปภาพด้วยครับ");
        return;
    }
    
    setLoading(true);

    try {
      // ✅ 1. แปลง Array Specs ให้เป็น JSON Object
      // ตัวอย่าง: [{key:"rpm", value:"500"}] -> {"rpm": "500"}
      const specificationsObject = specs.reduce((acc, curr) => {
        if (curr.key.trim() !== "") { // เอาเฉพาะที่มีชื่อ Key
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
      data.append("image_file", selectedFile); 

      // ✅ 3. ส่ง specifications เป็น JSON String
      data.append("specifications", JSON.stringify(specificationsObject));

      // ส่งข้อมูลไปหา Backend
      const res = await fetch("http://127.0.0.1:8000/items", {
        method: "POST",
        body: data, 
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to add item");
      }

      alert("✅ เพิ่มอุปกรณ์และอัปโหลดรูปภาพสำเร็จ!");
      onSuccess();
      
      // Reset Form ทั้งหมด
      setFormData({ name: "", category: "General", description: "", quantity: 1, unit: "pcs" });
      setSelectedFile(null);
      setSpecs([{ key: "", value: "" }]); // Reset specs
      onClose();

    } catch (error) {
      alert("❌ เกิดข้อผิดพลาด: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-blue-900">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-bold text-slate-800">✨ เพิ่มอุปกรณ์ใหม่</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 text-xl font-bold">✕</button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. ชื่ออุปกรณ์ */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ชื่ออุปกรณ์</label>
                <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>

            {/* 2. หมวดหมู่ & หน่วยนับ */}
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

            {/* 3. จำนวน */}
            <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">จำนวนตั้งต้น</label>
                    <input required type="number" min="1" className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                    value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}/>
            </div>

            {/* 4. ✅ ส่วน Specifications (Dynamic) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        ⚙️ Specifications <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
                    </label>
                    <button 
                        type="button" 
                        onClick={addSpecRow}
                        className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-200 font-bold transition-colors"
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
                                className="flex-1 p-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-400"
                                value={spec.key}
                                onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                            />
                            <span className="text-slate-300">:</span>
                            <input
                                type="text"
                                placeholder="ค่า (เช่น 500)"
                                className="flex-1 p-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-400"
                                value={spec.value}
                                onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                            />
                            {specs.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => removeSpecRow(index)}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
                                    title="ลบแถวนี้"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. รูปภาพ */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">รูปภาพอุปกรณ์</label>
                <div className="relative">
                    <input 
                    required
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    onChange={handleFileChange}
                    />
                </div>
                {selectedFile && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded border border-green-100">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        <span>พร้อมอัปโหลด: {selectedFile.name}</span>
                    </div>
                )}
            </div>

            {/* 6. รายละเอียด */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">รายละเอียด</label>
                <textarea rows={3} className="w-full p-2 border border-slate-300 rounded-lg outline-none resize-none" placeholder="รายละเอียดเพิ่มเติม..."
                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}/>
            </div>

            {/* ปุ่ม Submit */}
            <button type="submit" disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:bg-slate-300 disabled:shadow-none mt-4">
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        กำลังบันทึก...
                    </span>
                ) : "ยืนยันการเพิ่มอุปกรณ์"}
            </button>
            </form>
        </div>
      </div>
    </div>
  );
}