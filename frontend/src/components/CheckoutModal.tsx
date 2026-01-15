"use client";

import React, { useState, useEffect } from "react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { pickupDate: string; returnDate: string; purpose: string }) => void;
  loading: boolean;
}

export default function CheckoutModal({ isOpen, onClose, onConfirm, loading }: CheckoutModalProps) {
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Subjects List for Dropdown
  const subjects = [
    "FRA141 Computer Programming",
    "FRA161 Robotics Exploration",
    "FRA111 Basic Drawing",
    "FRA221 Digital Electronics",
    "FRA231 Static",
    "FRA241 Data Structure",
    "Senior Project",
    "Personal Project"
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Combine Subject and Details
    const fullPurpose = `${subject} ${details ? `(${details})` : ""}`;
    onConfirm({ pickupDate, returnDate, purpose: fullPurpose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">

        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            Requisition Details
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Date Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Pickup Date</label>
              <input
                type="date"
                required
                min={today} // ✅ Cannot select past dates
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-700 font-medium"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Return Date</label>
              <input
                type="date"
                required
                min={pickupDate || today} // ✅ Cannot return before pickup
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-700 font-medium"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
          </div>

          {/* Subject with Datalist (Dropdown + Search) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Subject / Purpose</label>
            <input
              list="subjects-list"
              required
              placeholder="Start typing or select subject..."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-700"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            {/* ✅ This creates the dropdown */}
            <datalist id="subjects-list">
              {subjects.map((subj) => (
                <option key={subj} value={subj} />
              ))}
            </datalist>
          </div>

          {/* Optional Details */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Additional Details (Optional)</label>
            <textarea
              placeholder="e.g. Group 5, Lab 2..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none h-20 resize-none text-slate-700"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-2">
              {loading ? "Submitting..." : "Confirm Requisition"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}