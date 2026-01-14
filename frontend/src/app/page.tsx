"use client";
import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import ItemCard from "@/components/ItemCard";
import { Item } from "@/types";
import CheckoutModal from "@/components/CheckoutModal";
import CartSidebar from "@/components/CartSidebar";
import { useSession, signIn } from "next-auth/react";

interface CartItem extends Item {
  borrow_qty: number;
}

// ✅ FIX: Use Environment Variable
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const { data: session } = useSession();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ IMPROVEMENT: Extract fetch logic to reuse it after checkout
  const fetchItems = useCallback(async () => {
    try {
      // ✅ FIX: Use API_URL
      const res = await fetch(`${API_URL}/items`);
      if (!res.ok) throw new Error("Failed to fetch");
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
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // --- Logic: Search / Filter ---
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(item.specifications).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Logic: Add to Cart ---
  const handleBorrowClick = (item: Item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((c) => c.item_id === item.item_id);
      if (existingItem) {
        if (existingItem.borrow_qty < item.available_quantity) {
          return prevCart.map((c) =>
            c.item_id === item.item_id ? { ...c, borrow_qty: c.borrow_qty + 1 } : c
          );
        } else {
          alert("คุณหยิบครบจำนวนที่มีในสต็อกแล้ว");
          return prevCart;
        }
      } else {
        return [...prevCart, { ...item, borrow_qty: 1 }];
      }
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((i) => i.item_id !== itemId));
  };

  const handleIncreaseItem = (itemId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.item_id === itemId && item.borrow_qty < item.available_quantity) {
          return { ...item, borrow_qty: item.borrow_qty + 1 };
        }
        return item;
      })
    );
  };

  const handleDecreaseItem = (itemId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.item_id === itemId && item.borrow_qty > 1) {
          return { ...item, borrow_qty: item.borrow_qty - 1 };
        }
        return item;
      })
    );
  };

  // --- Logic: Checkout ---
  const handleCheckout = async (formData: { pickupDate: string; returnDate: string; purpose: string }) => {
    if (!session || !session.user) {
      alert("กรุณา Login ก่อนทำการเบิกอุปกรณ์!");
      signIn("google");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        user_email: session.user.email,
        user_name: session.user.name || "Unknown Student",
        pickup_date: formData.pickupDate,
        due_date: formData.returnDate,
        purpose: formData.purpose,
        items: cart.map((item) => ({
          item_id: Number(item.item_id),
          quantity: item.borrow_qty,
        })),
      };

      // ✅ FIX: Use API_URL
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "การจองล้มเหลว");
      }

      alert("จองสำเร็จ! กรุณารอการอนุมัติ");
      setCart([]);
      setIsCartOpen(false);
      setIsCheckoutModalOpen(false);
      
      // ✅ FIX: Refetch data instead of window.location.reload()
      fetchItems(); 

    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        cartCount={cart.reduce((sum, item) => sum + item.borrow_qty, 0)}
        onCartClick={() => setIsCartOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <main className="max-w-6xl mx-auto pt-8 px-4 pb-20">
        {loading ? (
          <p className="text-center text-xl text-gray-500 mt-10">Loading inventory...</p>
        ) : (
          <>
            {filteredItems.length === 0 ? (
              <div className="text-center text-gray-400 mt-10"><p>ไม่พบอุปกรณ์ที่ค้นหา</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <ItemCard key={item.item_id} item={item} onAddToCart={handleBorrowClick} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={() => setIsCheckoutModalOpen(true)}
        onIncreaseItem={handleIncreaseItem}
        onDecreaseItem={handleDecreaseItem}
      />
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirm={handleCheckout}
        loading={isSubmitting}
      />
    </div>
  );
}