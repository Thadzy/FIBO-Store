"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import { Toaster, toast } from "react-hot-toast";

import Navbar from "@/components/Navbar";
import ItemCard from "@/components/ItemCard";
import CartSidebar from "@/components/CartSidebar";
import CheckoutModal from "@/components/CheckoutModal";
import { Item } from "@/types";

interface CartItem extends Item {
  borrow_qty: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const { data: session } = useSession();

  // Inventory State
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Cart & Modal State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/items`);
      if (!res.ok) throw new Error("Failed to fetch inventory data");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Inventory fetch error:", error);
      toast.error("Unable to load inventory items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // --- Logic: Derived Categories ---
  // Extract unique categories from items list automatically
  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category || "General"));
    return ["All", ...Array.from(cats)];
  }, [items]);

  // --- Logic: Filter Items ---
  const filteredItems = items.filter((item) => {
    // 1. Search Filter
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(item.specifications).toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Category Filter
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // --- Logic: Add to Cart ---
  const handleBorrowClick = (item: Item) => {
    // 1. Check if the item is already in the cart (using the current state)
    const existingItem = cart.find((c) => c.item_id === item.item_id);

    if (existingItem) {
      // Case A: Item exists, check stock limit
      if (existingItem.borrow_qty < item.available_quantity) {
        // ✅ Side Effect: Show Toast FIRST
        toast.success(`Added another ${item.name}`);
        
        // ✅ State Update: Pure function
        setCart((prevCart) =>
          prevCart.map((c) =>
            c.item_id === item.item_id ? { ...c, borrow_qty: c.borrow_qty + 1 } : c
          )
        );
      } else {
        // Case B: Stock limit reached
        toast.error("Cannot add more. Stock limit reached.");
        // No state update needed
      }
    } else {
      // Case C: New Item
      // ✅ Side Effect: Show Toast FIRST
      toast.success(`Added ${item.name} to cart`);
      
      // ✅ State Update: Pure function
      setCart((prevCart) => [...prevCart, { ...item, borrow_qty: 1 }]);
    }

    // Always open the sidebar
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

  const handleCheckout = async (formData: { pickupDate: string; returnDate: string; purpose: string }) => {
    if (!session || !session.user) {
      toast.error("Please sign in to continue.");
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

      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Booking failed.");
      }

      toast.success("Requisition submitted successfully!");
      setCart([]);
      setIsCartOpen(false);
      setIsCheckoutModalOpen(false);
      fetchItems();

    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      <Navbar
        cartCount={cart.reduce((sum, item) => sum + item.borrow_qty, 0)}
        onCartClick={() => setIsCartOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <main className="max-w-6xl mx-auto pt-8 px-4 pb-20">
        
        {/* Category Filter Bar */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex space-x-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-blue-900 text-white shadow-md shadow-blue-900/20"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center mt-20 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            <p className="text-xl text-gray-500">Loading inventory...</p>
          </div>
        ) : (
          <>
            {filteredItems.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <p className="text-2xl font-bold mb-2">No items found</p>
                <p className="text-sm">Try adjusting your search or category.</p>
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
        {/* <div className="mt-10 p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-lg overflow-auto">
          <p className="font-bold text-white mb-2">DEBUG: CURRENT SESSION DATA</p>
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </div> */}
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