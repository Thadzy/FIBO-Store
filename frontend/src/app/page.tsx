"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { Toaster, toast } from "react-hot-toast";

import Navbar from "@/components/Navbar";
import ItemCard from "@/components/ItemCard";
import CartSidebar from "@/components/CartSidebar";
import CheckoutModal from "@/components/CheckoutModal";
import { Item } from "@/types";

/**
 * Represents an item currently in the user's shopping cart.
 * Extends the base Item interface with a borrow quantity.
 */
interface CartItem extends Item {
  borrow_qty: number;
}

/**
 * Base API URL from environment variables.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Home Page (Catalog)
 * * The main landing page displaying the inventory grid.
 * It handles item searching, cart management, and the checkout process.
 */
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

  // Search State
  const [searchTerm, setSearchTerm] = useState<string>("");

  /**
   * Fetches the latest inventory items from the backend.
   * Uses useCallback to allow safe inclusion in dependency arrays.
   */
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

  // Initial Data Load
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  /**
   * Filters items based on the search term.
   * Searches against item name and specifications JSON string.
   */
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(item.specifications)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  /**
   * Adds an item to the cart or increments quantity if it already exists.
   * Checks against available stock before adding.
   */
  // --- Logic: Add to Cart ---
  const handleBorrowClick = (item: Item) => {
    // 1. Check existing item in the CURRENT cart state
    const existingItem = cart.find((c) => c.item_id === item.item_id);

    if (existingItem) {
      // Case 1: Item exists, check stock limit
      if (existingItem.borrow_qty < item.available_quantity) {
        toast.success(`Added another ${item.name}`);

        // Update State
        setCart((prevCart) =>
          prevCart.map((c) =>
            c.item_id === item.item_id
              ? { ...c, borrow_qty: c.borrow_qty + 1 }
              : c
          )
        );
      } else {
        // Case 2: Stock limit reached
        toast.error("Cannot add more. Stock limit reached.");
        // No state update needed here
      }
    } else {
      // Case 3: New Item
      toast.success(`Added ${item.name} to cart`);

      // Update State
      setCart((prevCart) => [...prevCart, { ...item, borrow_qty: 1 }]);
    }

    // Open Sidebar
    setIsCartOpen(true);
  };

  /**
   * Removes an item completely from the cart.
   */
  const handleRemoveFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((i) => i.item_id !== itemId));
  };

  /**
   * Increments the quantity of a specific item in the cart.
   */
  const handleIncreaseItem = (itemId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
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

  /**
   * Decrements the quantity of a specific item in the cart.
   * Minimum quantity is maintained at 1.
   */
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

  /**
   * Processes the checkout submission.
   * Validates authentication, constructs payload, and sends POST request to backend.
   */
  const handleCheckout = async (formData: {
    pickupDate: string;
    returnDate: string;
    purpose: string;
  }) => {
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

      toast.success(
        "Requisition submitted successfully! Please wait for approval."
      );

      // Reset State
      setCart([]);
      setIsCartOpen(false);
      setIsCheckoutModalOpen(false);

      // Refresh Inventory to show updated stock
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
                <p className="text-sm">Try adjusting your search terms.</p>
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
