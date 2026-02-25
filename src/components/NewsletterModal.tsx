/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Mail, Check, ChevronLeft, CheckCircle } from "lucide-react";
import { RemoveScroll } from "react-remove-scroll";
import { AnimatePresence, motion } from "framer-motion";
import { newsletterSubscribeSchema } from "@/lib/validation/newsletter";

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: "breaking", name: "Breaking / Trending" },
  { id: "tech", name: "Technology & Innovation" },
  { id: "business", name: "Business & Finance" },
  { id: "lifestyle", name: "Lifestyle & Wellness" },
  { id: "entertainment", name: "Entertainment & Culture" },
  { id: "education", name: "Education & Learning" },
  { id: "community", name: "Local / Community" },
  { id: "environment", name: "Environment & Sustainability" },
  { id: "sports", name: "Sports & Recreation" },
  { id: "opinion", name: "Opinion / Editorials" },
];

export function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const [step, setStep] = useState<
    "email" | "verification" | "interests" | "success"
  >("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Verification UI state (frontend-only for now)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [sentCode, setSentCode] = useState("302477");
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

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
    onError: (error) => {
      console.error("Subscribe error:", error);
      setError("Failed to subscribe. Please try again.");
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = newsletterSubscribeSchema.safeParse({ email });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors.email;
      setError(fieldErrors?.[0] ?? "Invalid email");
      return;
    }

    setError("");

    // Call existing backend to store subscriber, then move to interests UI
    subscribeMutation.mutate(parsed.data.email, {
      onSuccess: () => {
        setStep("interests");
      },
    });
  };

  const handleInterestsSubmit = () => {
    setStep("verification");
  };

  const handleVerificationSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code === sentCode) {
      setStep("success");
    } else {
      setOtpError(true);
    }
  };

  const handleFinalClose = () => {
    onClose();
    setTimeout(() => {
      setStep("email");
      setEmail("");
      setSelectedInterests([]);
      setError("");
      setOtp(["", "", "", "", "", ""]);
      setOtpError(false);
      setSentCode("302477");
      subscribeMutation.reset();
    }, 300);
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((i) => i !== interestId)
        : [...prev, interestId]
    );
  };

  const handleOtpChange = (index: number, value: string) => {
    if (otpError) setOtpError(false);
    const digit = value.replace(/\D/g, "").slice(-1);
    if (!digit && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (step === "verification") {
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
    }
  }, [step]);

  if (!isOpen) return null;

  return (
    <>
      <RemoveScroll enabled={isOpen}>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Modal Panel */}
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 bg-[#ff4500] rounded-t-2xl shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-sans">
                {step === "email" && "Subscribe to Newsletter"}
                {step === "verification" && "Verify Your Email"}
                {step === "interests" && "Choose Your Interests"}
                {step === "success" && "You're All Set!"}
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-full transition-colors inline-flex items-center justify-center"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            </div>

            {/* Content Container */}
            <div className="p-5 sm:p-8 overflow-y-auto min-h-0">
              <AnimatePresence mode="wait">
                {step === "email" && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleEmailSubmit}>
                      <div className="relative mb-3 sm:mb-4">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#ff4500]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) setError("");
                          }}
                          placeholder="Enter your email address"
                          autoFocus
                          className={`w-full thick-border pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base bg-gray-100 border-2 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all placeholder:text-gray-500 font-sans ${
                            error
                              ? "border-red-500 bg-red-50"
                              : "border-transparent"
                          }`}
                        />
                      </div>
                      {error && (
                        <p className="text-xs sm:text-sm text-red-500 mb-3 sm:mb-4 font-sans">
                          {error}
                        </p>
                      )}
                      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
                        <button
                          type="submit"
                          disabled={subscribeMutation.isPending}
                          className="flex-1 bg-[#ff4500] text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg hover:bg-[#e63e00] transition-colors font-medium text-sm sm:text-base font-sans disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {subscribeMutation.isPending ? "Submitting..." : "Next"}
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-6 sm:px-8 py-3 sm:py-3.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm sm:text-base font-sans"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>

                    <div className="pt-4 sm:pt-6 border-t border-gray-200">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4 font-sans">
                        What you'll get
                      </h3>
                      <ul className="space-y-2 sm:space-y-3">
                        {[
                          "Daily curated news and trending products",
                          "AI-powered insights and analysis",
                          "Exclusive content across 8+ categories",
                        ].map((benefit) => (
                          <li
                            key={benefit}
                            className="flex items-start gap-2 sm:gap-3"
                          >
                            <span className="text-[#ff4500] mt-0.5 flex-shrink-0 text-xs sm:text-sm">
                              ✓
                            </span>
                            <span className="text-xs sm:text-sm text-gray-700 font-sans">
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {step === "verification" && (
                  <motion.div
                    key="verification"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="text-center py-2 sm:py-4 relative"
                  >
                    {/* Back Arrow */}
                    <button
                      onClick={() => setStep("interests")}
                      className="absolute left-0 top-0 p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
                      aria-label="Back to interests"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex justify-center mb-4 sm:mb-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#ff4500]/10 rounded-2xl flex items-center justify-center">
                        <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-[#ff4500]" />
                      </div>
                    </div>

                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 font-sans">
                      Please check your email
                    </h3>
                    <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-8 font-sans">
                      We've sent a code to{" "}
                      <strong className="text-gray-900">{email}</strong>
                    </p>
                    <p className="text-[10px] sm:text-sm text-gray-500 mb-4 sm:mb-6 font-sans">
                      Demo code:{" "}
                      <strong className="text-[#ff4500]">{sentCode}</strong>
                    </p>

                    <form onSubmit={handleVerificationSubmit}>
                      <div className="flex justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpInputs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                              handleOtpChange(idx, e.target.value)
                            }
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            className={`w-9 h-11 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-semibold border-2 rounded-lg focus:border-[#ff4500] focus:outline-none transition-all bg-white font-sans text-gray-900 ${
                              otpError ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={otp.some((d) => !d)}
                        className={`w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg font-medium text-sm sm:text-base mb-3 sm:mb-4 transition-colors font-sans ${
                          otp.some((d) => !d)
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-[#ff4500] text-white hover:bg-[#e63e00]"
                        }`}
                      >
                        Verify
                      </button>

                      <p className="text-xs sm:text-sm text-gray-600 font-sans">
                        Didn't receive an email?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            const code = Math.floor(
                              100000 + Math.random() * 900000
                            ).toString();
                            setSentCode(code);
                            setOtp(["", "", "", "", "", ""]);
                            setOtpError(false);
                            otpInputs.current[0]?.focus();
                          }}
                          className="text-gray-900 font-semibold hover:text-[#ff4500] transition-colors"
                        >
                          Resend
                        </button>
                      </p>

                      {otpError && (
                        <p className="text-xs sm:text-sm text-red-500 mt-2 font-sans">
                          Invalid verification code. Please try again.
                        </p>
                      )}
                    </form>
                  </motion.div>
                )}

                {step === "interests" && (
                  <motion.div
                    key="interests"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6 max-h-60 sm:max-h-96 overflow-y-auto pr-2">
                      {CATEGORIES.map((category) => {
                        const isSelected = selectedInterests.includes(
                          category.id
                        );
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => toggleInterest(category.id)}
                            className={`p-3 sm:p-4 rounded-xl transition-all text-left relative group border-2 ${
                              isSelected
                                ? "bg-white border-[#ff4500] shadow-md"
                                : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute inset-0 bg-gradient-to-br from-[#ff4500]/5 to-transparent pointer-events-none rounded-xl" />
                            )}
                            <div className="flex items-center justify-between gap-2 sm:gap-3 relative z-10">
                              <span
                                className={`text-xs sm:text-sm font-medium flex-1 font-sans ${
                                  isSelected
                                    ? "text-[#ff4500]"
                                    : "text-gray-900"
                                }`}
                              >
                                {category.name}
                              </span>
                              {isSelected && (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#ff4500] rounded-full flex items-center justify-center flex-shrink-0 transition-transform scale-110">
                                  <Check className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white stroke-[3.5]" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-gray-500 mb-4 sm:mb-6 text-center text-[10px] sm:text-sm font-sans">
                      Select topics to personalize your experience
                    </p>

                    <div className="flex items-center justify-between pt-3 sm:pt-4 pb-3 sm:pb-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setStep("email")}
                        className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 sm:gap-2 transition-colors font-sans"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Back
                      </button>

                      <div className="text-xs sm:text-sm text-gray-600 font-medium font-sans">
                        {selectedInterests.length}{" "}
                        {selectedInterests.length === 1
                          ? "category"
                          : "categories"}
                      </div>
                    </div>

                    <div className="flex gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={handleInterestsSubmit}
                        disabled={selectedInterests.length === 0}
                        className={`flex-1 px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg transition-colors font-medium text-sm sm:text-base font-sans ${
                          selectedInterests.length === 0
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-[#ff4500] text-white hover:bg-[#e63e00]"
                        }`}
                      >
                        Next
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-6 sm:px-8 py-3 sm:py-3.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm sm:text-base font-sans"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="text-center py-4"
                  >
                    <div className="flex justify-center mb-4 sm:mb-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#ff4500]/10 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-[#ff4500]" />
                      </div>
                    </div>

                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 font-sans">
                      Subscription Successful
                    </h3>
                    <p className="text-xs sm:text-base text-gray-600 mb-6 sm:mb-8 font-sans">
                      You're now subscribed to our newsletter
                    </p>

                    <button
                      type="button"
                      onClick={handleFinalClose}
                      className="w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg font-bold text-base sm:text-lg bg-[#ff4500] text-white hover:bg-[#e63e00] transition-all active:scale-[0.98] font-sans"
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </RemoveScroll>
    </>
  );
}
