"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ItemCard from "@/components/ItemCard";
import { Item } from "@/types";
import CheckoutModal from "@/components/CheckoutModal";
import CartSidebar from "@/components/CartSidebar";
import { useSession, signIn } from "next-auth/react"; // Import Auth Hooks

// 1. สร้าง Type สำหรับของในตะกร้า (สืบทอดมาจาก Item แต่เพิ่ม borrow_qty)
interface CartItem extends Item {
  borrow_qty: number;
}

export default function Home() {
  const { data: session } = useSession(); // ดึง Session มาใช้

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 2. ใช้ CartItem[] แทน Item[] เพื่อให้รองรับ borrow_qty
  const [cart, setCart] = useState<CartItem[]>([]);

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Fetch Items (ทำงานครั้งเดียวตอนโหลดหน้า) ---
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/items");
        const data = await res.json();

        if (Array.isArray(data)) {
          setItems(data);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // --- Logic: Search / Filter ---
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(item.specifications)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // --- Logic: Add to Cart ---
  const handleBorrowClick = (item: Item) => {
    setCart((prevCart) => {
      // เช็คว่ามีของชิ้นนี้ในตะกร้าหรือยัง?
      const existingItem = prevCart.find((c) => c.item_id === item.item_id);

      if (existingItem) {
        // ถ้ามีแล้ว ให้บวกจำนวนเพิ่ม (แต่ห้ามเกินสต็อกจริง)
        if (existingItem.borrow_qty < item.available_quantity) {
          return prevCart.map((c) =>
            c.item_id === item.item_id
              ? { ...c, borrow_qty: c.borrow_qty + 1 }
              : c
          );
        } else {
          alert("คุณหยิบครบจำนวนที่มีในสต็อกแล้ว");
          return prevCart;
        }
      } else {
        // ถ้ายังไม่มี ให้เพิ่มเข้าไปใหม่เริ่มที่ 1 ชิ้น
        return [...prevCart, { ...item, borrow_qty: 1 }];
      }
    });

    // เปิด Sidebar ทันทีที่กดหยิบใส่ตะกร้า
    setIsCartOpen(true);
  };

  // --- Logic: Remove from Cart ---
  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.item_id !== itemId));
  };

  // --- Logic: Checkout (Submit to API) ---
  const handleCheckout = async (formData: {
    pickupDate: string;
    returnDate: string;
    purpose: string;
  }) => {
    // 3. เช็คว่า Login หรือยัง?
    if (!session || !session.user) {
      alert("กรุณา Login ก่อนทำการเบิกอุปกรณ์!");
      signIn("google"); // เด้งไปหน้า Login ให้เลย
      return;
    }

    setIsSubmitting(true);
    try {
      // 4. เปลี่ยน Payload: ส่ง Email แทน User ID
      const payload = {
        user_email: session.user.email, // ส่ง Email ไปเช็ค/สร้าง user ที่ backend
        user_name: session.user.name || "Unknown Student",
        pickup_date: formData.pickupDate,
        due_date: formData.returnDate,
        purpose: formData.purpose,
        items: cart.map((item) => ({
          item_id: Number(item.item_id),
          quantity: item.borrow_qty,
        })),
      };

      // ยิง API POST
      const res = await fetch("http://127.0.0.1:8000/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "การจองล้มเหลว");
      }

      // 5. ถ้าสำเร็จ
      alert("จองสำเร็จ! กรุณารอการอนุมัติ");
      setCart([]);
      setIsCartOpen(false);
      setIsCheckoutModalOpen(false);

      // รีโหลดหน้าเว็บเพื่อให้สต็อกอัปเดตทันที
      window.location.reload();
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIncreaseItem = (itemId: string) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        // เช็คว่าไอดีตรงกัน และต้องไม่เกิน Available Stock
        if (
          item.item_id === itemId &&
          item.borrow_qty < item.available_quantity
        ) {
          return { ...item, borrow_qty: item.borrow_qty + 1 };
        }
        return item;
      })
    );
  };

  const handleDecreaseItem = (itemId: string) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        // ลดจำนวนลง แต่ต่ำสุดคือ 1 (ถ้าจะลบให้กดปุ่มถังขยะแทน)
        if (item.item_id === itemId && item.borrow_qty > 1) {
          return { ...item, borrow_qty: item.borrow_qty - 1 };
        }
        return item;
      })
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 1. Header / Navbar */}
      <Navbar
        cartCount={cart.reduce((sum, item) => sum + item.borrow_qty, 0)}
        onCartClick={() => setIsCartOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* 2. Main Content Grid */}
      <main className="max-w-6xl mx-auto pt-8 px-4 pb-20">
        {loading ? (
          <p className="text-center text-xl text-gray-500 mt-10">
            Loading inventory...
          </p>
        ) : (
          <>
            {filteredItems.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                <p className="text-2xl"></p>
                <p>ไม่พบอุปกรณ์ที่ค้นหา</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.item_id}
                    item={item}
                    onAddToCart={handleBorrowClick}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={() => setIsCheckoutModalOpen(true)}
        // ✅ ส่ง props ใหม่เข้าไป
        onIncreaseItem={handleIncreaseItem}
        onDecreaseItem={handleDecreaseItem}
      />

      {/* 4. Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirm={handleCheckout}
        loading={isSubmitting}
      />
    </div>
  );
}
