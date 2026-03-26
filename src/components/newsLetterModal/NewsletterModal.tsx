/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef, useState } from "react";
import { X, Mail, Check, ChevronLeft, CheckCircle } from "lucide-react";
import { RemoveScroll } from "react-remove-scroll";
import { AnimatePresence, motion } from "framer-motion";
import { newsletterSubscribeSchema } from "@/lib/validation/newsletter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { VerifyEmailStep } from "./VerifyEmailStep";
import { InterestsStep } from "./InterestsStep";

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryOption = {
  id: string;
  name: string;
};

export function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const [step, setStep] = useState<
    "email" | "verification" | "interests" | "success"
  >("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [otpSendError, setOtpSendError] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState("");
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Load available newsletter categories when the modal is open
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesIsError,
    error: categoriesError,
  } = useQuery<CategoryOption[], Error>({
    queryKey: ["newsletterCategories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Failed to load categories");
      }
      return (await res.json()) as CategoryOption[];
    },
    enabled: isOpen,
  });

  // Check if an email is already subscribed before proceeding
  const checkEmailMutation = useMutation<
    { subscribed?: boolean },
    Error,
    string
  >({
    mutationFn: async (emailToCheck) => {
      const res = await fetch("/api/newsletter/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailToCheck }),
      });

      if (!res.ok) {
        throw new Error("Something went wrong. Please try again.");
      }

      return (await res.json()) as { subscribed?: boolean };
    },
  });

  // Send OTP code to the user's email and move to verification on success
  const sendOtpMutation = useMutation<void, Error, string>({
    mutationFn: async (emailToSend) => {
      const res = await fetch("/api/newsletter/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailToSend }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to send verification code.";
        throw new Error(message);
      }
    },
    onSuccess: () => {
      setOtpSendError("");
      setStep("verification");
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
    },
    onError: (err) => {
      setOtpSendError(err.message || "Failed to send verification code.");
    },
  });

  // Verify the OTP code and complete subscription on success
  const verifyOtpMutation = useMutation<
    void,
    Error,
    { email: string; code: string; categories: string[] }
  >({
    mutationFn: async ({ email, code, categories }) => {
      const res = await fetch("/api/newsletter/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code, categories }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Invalid verification code. Please try again.";
        throw new Error(message);
      }
    },
    onSuccess: () => {
      setOtpError(false);
      setOtpErrorMessage("");
      setStep("success");
    },
    onError: (err) => {
      setOtpError(true);
      setOtpErrorMessage(err.message || "Invalid verification code. Please try again.");
    },
  });

  const categoriesErrorMessage = categoriesIsError
    ? categoriesError?.message ?? "Failed to load categories"
    : "";

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle submit for the email step (validate + check subscription)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = newsletterSubscribeSchema.safeParse({ email });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors.email;
      setError(fieldErrors?.[0] ?? "Invalid email");
      return;
    }

    try {
      setError("");
      const data = await checkEmailMutation.mutateAsync(parsed.data.email);

      if (data.subscribed) {
        setError("Email is already subscribed");
        return;
      }

      // Not yet subscribed; move to interests step
      setStep("interests");
    } catch (err) {
      console.error("Check email error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  // Handle submit for the interests step (send OTP)
  const handleInterestsSubmit = async () => {
    if (!email) return;

    try {
      setOtpSendError("");
      await sendOtpMutation.mutateAsync(email);
    } catch (err) {
      console.error("Failed to send OTP:", err);
    }
  };

  // Handle submit for the verification step (verify OTP)
  const handleVerificationSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join("");

    if (!email || code.length !== 6) {
      setOtpError(true);
      return;
    }

    try {
      setOtpError(false);
      await verifyOtpMutation.mutateAsync({
        email,
        code,
        categories: selectedInterests,
      });
    } catch (err) {
      console.error("Verify OTP error:", err);
    }
  };

  // Handle closing the modal after success and reset all related states
  const handleFinalClose = () => {
    onClose();
    setTimeout(() => {
      setStep("email");
      setEmail("");
      setSelectedInterests([]);
      setError("");
      setOtp(["", "", "", "", "", ""]);
      setOtpError(false);
      setOtpErrorMessage("");
      setOtpSendError("");
      setResendCooldown(0);
    }, 300);
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((i) => i !== interestId)
        : [...prev, interestId]
    );
  };

  //Toggle a category in the selected interests array
  const handleOtpChange = (index: number, value: string) => {
    if (otpError) setOtpError(false);
    if (otpErrorMessage) setOtpErrorMessage("");
    const digit = value.replace(/\D/g, "").slice(-1);
    if (!digit && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  //Handle keyboard behavior inside OTP inputs (backspace to go back)
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

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
                    <form noValidate onSubmit={handleEmailSubmit}>
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
                          className={`w-full thick-border pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base bg-gray-100 border-2 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all placeholder:text-gray-500 font-sans ${error
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
                          className="flex-1 bg-[#ff4500] text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg hover:bg-[#e63e00] transition-colors font-medium text-sm sm:text-base font-sans"
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
                  <VerifyEmailStep
                    email={email}
                    otp={otp}
                    otpError={otpError}
                    otpErrorMessage={otpErrorMessage}
                    resendCooldown={resendCooldown}
                    otpSendError={otpSendError}
                    isVerifying={verifyOtpMutation.isPending}
                    otpInputsRef={otpInputs}
                    onBack={() => setStep("interests")}
                    onSubmit={handleVerificationSubmit}
                    onOtpChange={handleOtpChange}
                    onKeyDown={handleKeyDown}
                    onResend={async () => {
                      setOtp(["", "", "", "", "", ""]);
                      setOtpError(false);
                      otpInputs.current[0]?.focus();
                      try {
                        await sendOtpMutation.mutateAsync(email);
                        setTimeout(() => otpInputs.current[0]?.focus(), 100);
                        setResendCooldown(120);
                      } catch (err) {
                        console.error("Failed to resend OTP", err);
                      }
                    }}
                  />
                )}

                {step === "interests" && (
                  <InterestsStep
                    categories={categories}
                    categoriesLoading={categoriesLoading}
                    categoriesErrorMessage={categoriesErrorMessage}
                    selectedInterests={selectedInterests}
                    otpSendError={otpSendError}
                    isSendingOtp={sendOtpMutation.isPending}
                    onBack={() => setStep("email")}
                    onToggleInterest={toggleInterest}
                    onSubmit={handleInterestsSubmit}
                    onCancel={onClose}
                  />
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
