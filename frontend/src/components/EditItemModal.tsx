"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Item } from "@/types";

/**
 * Props for the EditItemModal component.
 */
interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: Item | null;
}

/**
 * Interface for managing dynamic specification rows in the form.
 */
interface SpecRow {
  key: string;
  value: string;
}

/**
 * Base API URL from environment variables.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * EditItemModal Component
 * * A modal form for updating existing inventory items.
 * Pre-fills data from the selected item and allows modification of fields including images and dynamic specs.
 */
export default function EditItemModal({ isOpen, onClose, onSuccess, item }: EditItemModalProps) {
  const [loading, setLoading] = useState(false);

  // 1. Basic Information State
  const [formData, setFormData] = useState({
    name: "",
    category: "General",
    description: "",
    quantity: 1,
    unit: "pcs",
  });

  // 2. Image File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 3. Dynamic Specifications State
  const [specs, setSpecs] = useState<SpecRow[]>([{ key: "", value: "" }]);

  /**
   * Effect: Populate form with existing item data when modal opens.
   */
  useEffect(() => {
    if (item) {
      // Populate basic fields
      setFormData({
        name: item.name,
        category: item.category || "General",
        description: item.description || "",
        quantity: item.available_quantity,
        unit: item.specifications?.unit || "pcs",
      });

      // Populate specifications (excluding 'unit' which has its own field)
      if (item.specifications) {
        const loadedSpecs: SpecRow[] = Object.entries(item.specifications)
          .filter(([key]) => key !== "unit")
          .map(([key, value]) => ({
            key: key,
            value: String(value),
          }));

        setSpecs(loadedSpecs.length > 0 ? loadedSpecs : [{ key: "", value: "" }]);
      } else {
        setSpecs([{ key: "", value: "" }]);
      }

      // Reset file input
      setSelectedFile(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  // --- Specification Handlers ---
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
    setLoading(true);

    try {
      // 1. Convert Specs Array to JSON Object
      const specificationsObject = specs.reduce((acc, curr) => {
        if (curr.key.trim() !== "") {
          acc[curr.key.trim()] = curr.value.trim();
        }
        return acc;
      }, {} as Record<string, any>);

      // 2. Create FormData payload
      const data = new FormData();
      data.append("name", formData.name);
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("quantity", formData.quantity.toString());
      data.append("unit", formData.unit);
      data.append("specifications", JSON.stringify(specificationsObject));

      // Only append image if a new one was selected
      if (selectedFile) {
        data.append("image_file", selectedFile);
      }

      // 3. Send PUT Request
      const res = await fetch(`${API_URL}/items/${item.item_id}`, {
        method: "PUT",
        body: data,
      });

      if (!res.ok) {
        const errorData = await res.json();
        
        // Handle FastAPI Validation Errors
        if (Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail
                .map((err: any) => `${err.loc[1]}: ${err.msg}`)
                .join("\n");
            throw new Error(errorMessages);
        }
        
        throw new Error(errorData.detail || "Failed to update item");
      }

      toast.success("Item updated successfully!");
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while updating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-blue-900">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-bold text-orange-800 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Item: {item.item_id}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* 1. Item Name */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Item Name</label>
              <input
                required
                type="text"
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* 2. Category & Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Sensors">Sensors</option>
                  <option value="Tools">Tools</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Unit</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            {/* 3. Quantity */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Stock Quantity</label>
              <input
                required
                type="number"
                min="0"
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              />
            </div>

            {/* 4. Dynamic Specifications */}
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-orange-800 flex items-center gap-2">
                  Specifications
                </label>
                <button
                  type="button"
                  onClick={addSpecRow}
                  className="text-xs bg-white border border-orange-200 text-orange-700 px-3 py-1.5 rounded-full hover:bg-orange-100 font-bold transition-colors flex items-center gap-1 shadow-sm"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Spec
                </button>
              </div>

              <div className="space-y-2">
                {specs.map((spec, index) => (
                  <div key={index} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200">
                    <input
                      type="text"
                      placeholder="Key (e.g. rpm)"
                      className="flex-1 p-2 text-xs border border-orange-200 rounded-lg outline-none focus:border-orange-400 bg-white"
                      value={spec.key}
                      onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                    />
                    <span className="text-orange-300">:</span>
                    <input
                      type="text"
                      placeholder="Value (e.g. 500)"
                      className="flex-1 p-2 text-xs border border-orange-200 rounded-lg outline-none focus:border-orange-400 bg-white"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecRow(index)}
                      className="text-orange-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                      title="Remove row"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Image File */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">New Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 border border-slate-200 rounded-xl cursor-pointer"
                onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
              />
            </div>

            {/* 6. Description */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all disabled:bg-slate-300 disabled:shadow-none mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Changes...
                </>
              ) : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}