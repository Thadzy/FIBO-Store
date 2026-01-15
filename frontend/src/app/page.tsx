"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import { Toaster, toast } from "react-hot-toast";

import Navbar from "@/components/Navbar";
import ItemCard from "@/components/ItemCard";
import CartSidebar from "@/components/CartSidebar";
import CheckoutModal from "@/components/CheckoutModal";
import { Item } from "@/types";

/**
 * Interface extending the base Item type to include quantities
 * specific to the user's current shopping session.
 */
interface CartItem extends Item {
  borrow_qty: number;
}

// API endpoint configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Home Component (Storefront)
 * * The primary landing page for the application.
 * Responsibilities:
 * 1. Data Fetching: Retrieves the master inventory list from the backend.
 * 2. State Management: Handles inventory, shopping cart, and UI modal states.
 * 3. Client-Side Filtering: Provides real-time search and category filtering.
 * 4. Transaction Management: Orchestrates the checkout flow.
 */
export default function Home() {
  const { data: session } = useSession();

  // --- State: Inventory Data ---
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // --- State: Shopping Cart & Modals ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- State: Filtering & Search ---
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  /**
   * Data Fetching: Retrieve Inventory
   * Wrapped in useCallback to maintain referential integrity.
   */
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/items`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch inventory data");
      }
      
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Inventory fetch error:", error);
      toast.error("Unable to load inventory items.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load trigger
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  /**
   * Computed Property: Unique Categories
   * Derives a list of unique categories from the items array.
   * Memoized to prevent recalculation on every render.
   */
  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category || "General"));
    return ["All", ...Array.from(cats)];
  }, [items]);

  /**
   * Computed Property: Filtered Inventory
   * Filters the master item list based on search terms and selected category.
   * Memoized to avoid lag during typing or cart updates.
   */
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Search Logic: Checks both name and specifications JSON string
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(item.specifications).toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Category Logic: Exact match or "All" wildcard
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  /**
   * Handler: Add to Cart
   * Manages the logic for adding items or incrementing quantities.
   * Enforces stock limits before updating state.
   */
  const handleBorrowClick = (item: Item) => {
    // Check if the item is already present in the user's cart
    const existingItem = cart.find((c) => c.item_id === item.item_id);

    if (existingItem) {
      // Scenario: Item exists, validate against available stock
      if (existingItem.borrow_qty < item.available_quantity) {
        toast.success(`Added another ${item.name}`);
        
        setCart((prevCart) =>
          prevCart.map((c) =>
            c.item_id === item.item_id ? { ...c, borrow_qty: c.borrow_qty + 1 } : c
          )
        );
      } else {
        // Validation Failure: Stock limit reached
        toast.error("Cannot add more. Stock limit reached.");
      }
    } else {
      // Scenario: New item being added to cart
      toast.success(`Added ${item.name} to cart`);
      
      setCart((prevCart) => [...prevCart, { ...item, borrow_qty: 1 }]);
    }

    // UX: Automatically open sidebar to show feedback
    setIsCartOpen(true);
  };

  /**
   * Handler: Remove Item
   * Completely removes an item entry from the cart.
   */
  const handleRemoveFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((i) => i.item_id !== itemId));
  };

  /**
   * Handler: Increment Quantity
   * Increases borrow quantity if stock permits.
   */
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

  /**
   * Handler: Decrement Quantity
   * Decreases borrow quantity, preventing it from dropping below 1.
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
   * Handler: Submit Checkout
   * Validates session, constructs the payload, and posts to the API.
   */
  const handleCheckout = async (formData: { pickupDate: string; returnDate: string; purpose: string }) => {
    // 1. Authentication Guard
    if (!session || !session.user) {
      toast.error("Please sign in to continue.");
      signIn("google");
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. Payload Construction
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

      // 3. API Submission
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Booking failed.");
      }

      // 4. Success Handling
      toast.success("Requisition submitted successfully!");
      setCart([]); // Clear cart
      setIsCartOpen(false);
      setIsCheckoutModalOpen(false);
      fetchItems(); // Refresh inventory to show updated stock

    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      {/* Navigation & Search */}
      <Navbar
        cartCount={cart.reduce((sum, item) => sum + item.borrow_qty, 0)}
        onCartClick={() => setIsCartOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <main className="max-w-6xl mx-auto pt-8 px-4 pb-20">
        
        {/* Category Filter Controls */}
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

        {/* Loading & Data Display */}
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
      </main>

      {/* Overlays: Cart & Checkout */}
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