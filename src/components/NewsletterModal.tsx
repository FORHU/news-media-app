"use client";

import { useState } from "react";
import { X, Mail } from "lucide-react";

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call API or save email
    onClose();
    setEmail("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - click to close */}
      <div
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal panel */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-[70] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Subscribe to Newsletter
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSubscribe}>
            <div className="relative mb-4">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ff4500]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                autoFocus
                className="w-full pl-12 pr-4 py-3.5 text-base border border-gray-300 rounded-lg focus:border-[#ff4500] focus:outline-none focus:ring-2 focus:ring-[#ff4500]/20 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-[#ff4500] text-white px-6 py-3.5 rounded-lg hover:bg-[#e63e00] transition-colors font-medium text-base"
              >
                Subscribe
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium text-base"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              What you&apos;ll get
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-[#ff4500] mt-0.5">✓</span>
                <span>Daily curated news and trending products</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ff4500] mt-0.5">✓</span>
                <span>AI-powered insights and analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ff4500] mt-0.5">✓</span>
                <span>Exclusive content across 8+ categories</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
