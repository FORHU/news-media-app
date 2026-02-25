"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Mail } from "lucide-react";
import { RemoveScroll } from "react-remove-scroll";
import { newsletterSubscribeSchema } from "@/lib/validation/newsletter";

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subscribeMutation = useMutation({
    mutationFn: async (inputEmail: string) => {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inputEmail }),
      });

      if (!res.ok) {
        throw new Error("Failed to subscribe");
      }

      return res.json();
    },
    onSuccess: () => {
      onClose();
      setEmail("");
      setErrorMessage(null);
    },
    onError: (error) => {
      console.error("Subscribe error:", error);
    },
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = newsletterSubscribeSchema.safeParse({ email });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors.email;
      setErrorMessage(fieldErrors?.[0] ?? "Invalid email");
      return;
    }

    setErrorMessage(null);
    subscribeMutation.mutate(parsed.data.email);
  };

  if (!isOpen) return null;

  return (
    <>
      <RemoveScroll enabled={isOpen}>
        {/* Backdrop - click to close */}
        <div
          className="fixed inset-0 bg-black/50 z-[60]"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Modal panel */}
        <div
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white rounded-xl shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[90dvh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 sm:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Subscribe to Newsletter
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubscribe}>
              <div className="relative mb-3 sm:mb-4">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#ff4500]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoFocus
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:border-[#ff4500] focus:outline-none focus:ring-2 focus:ring-[#ff4500]/20 transition-all"
                />
                {errorMessage && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">
                    {errorMessage}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="flex-1 bg-[#ff4500] text-white px-6 py-2.5 sm:py-3.5 rounded-lg hover:bg-[#e63e00] transition-colors font-medium text-sm sm:text-base order-1 sm:order-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {subscribeMutation.isPending ? "Subscribing..." : "Subscribe"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 sm:py-3.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm sm:text-base order-2 sm:order-1"
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="hidden sm:block mt-8 pt-6 border-t border-gray-200">
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
      </RemoveScroll>
    </>
  );
}
