"use client";
import { useState, useEffect } from "react";

interface Item {
  item_id: string;
  name: string;
  location: string;
  specifications: Record<string, unknown>;
  available_quantity: number;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/items");
        const data = await res.json();
        setItems(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching items:", error);
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-blue-900">FIBO Store</h1>
        <p className="text-gray-600 mt-2">ระบบเบิกจ่ายอุปกรณ์สำหรับนักศึกษา</p>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto">
        {loading ? (
          <p className="text-center text-xl">Loading data...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.item_id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <div className="h-32 bg-gray-200 rounded mb-4 flex items-center justify-center text-gray-400">
                  {/* ใส่รูป Placeholder ไว้ก่อน */}
                  <span>Image</span>
                </div>
                <h2 className="text-xl font-bold mb-2 text-gray-800">
                  {item.name}
                </h2>
                <p className="text-sm text-gray-500 mb-2">📍 {item.location}</p>

                {/* โชว์ Spec แบบ JSON */}
                <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-4 h-20 overflow-y-auto">
                  <pre>{JSON.stringify(item.specifications, null, 2)}</pre>
                </div>

                <div className="flex justify-between items-center">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      item.available_quantity > 0
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.available_quantity > 0
                      ? `ว่าง ${item.available_quantity} ชิ้น`
                      : "ของหมด"}
                  </span>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={item.available_quantity === 0}
                  >
                    เบิกของ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
