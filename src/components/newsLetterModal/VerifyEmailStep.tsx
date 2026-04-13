import { Mail, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { MutableRefObject, KeyboardEvent, FormEvent } from "react";

interface VerifyEmailStepProps {
  email: string;
  otp: string[];
  otpError: boolean;
  otpErrorMessage: string;
  resendCooldown: number;
  otpSendError: string;
  isVerifying: boolean;
  otpInputsRef: MutableRefObject<(HTMLInputElement | null)[]>;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void;
  onOtpChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: KeyboardEvent<HTMLInputElement>) => void;
  onResend: () => void;
}

export function VerifyEmailStep({
  email,
  otp,
  otpError,
  otpErrorMessage,
  resendCooldown,
  otpSendError,
  isVerifying,
  otpInputsRef,
  onBack,
  onSubmit,
  onOtpChange,
  onKeyDown,
  onResend,
}: VerifyEmailStepProps) {
  return (
    <motion.div
      key="verification"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="text-center py-2 sm:py-4 relative"
    >
      {/* Back Arrow */}
      <button
        onClick={onBack}
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
        We&apos;ve sent a code to{" "}
        <strong className="text-gray-900">{email}</strong>
      </p>
      <form onSubmit={onSubmit}>
        <div className="flex justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                otpInputsRef.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => onOtpChange(idx, e.target.value)}
              onKeyDown={(e) => onKeyDown(idx, e)}
              className={`w-9 h-11 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-semibold border-2 rounded-lg focus:border-[#ff4500] focus:outline-none transition-all bg-white font-sans text-gray-900 ${
                otpError ? "border-red-500" : "border-gray-300"
              }`}
            />
          ))}
        </div>
        {otpSendError && (
            <p className="text-sm sm:text-base text-red-500 mt-2 mb-4 font-sans">
              {otpSendError}
            </p>
          )}

          {otpError && (
            <p className="text-sm sm:text-base text-red-500 mt-2 mb-4 font-sans">
              {otpErrorMessage || "Invalid verification code. Please try again."}
            </p>
          )}
        <button
          type="submit"
          disabled={otp.some((d) => !d) || isVerifying}
          className={`w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg font-medium text-sm sm:text-base mb-3 sm:mb-4 transition-colors font-sans ${
            otp.some((d) => !d) || isVerifying
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#ff4500] text-white hover:bg-[#e63e00]"
          }`}
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </button>

        {resendCooldown > 0 ? (
          <p className="text-xs sm:text-sm text-gray-600 font-sans">
            You can request a new code in{" "}
            <span className="font-semibold text-gray-900">
              {resendCooldown}s
            </span>
            .
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-gray-600 font-sans">
            Didn&apos;t receive an email?{" "}
            <button
              type="button"
              onClick={onResend}
              className="text-gray-900 font-semibold hover:text-[#ff4500] transition-colors"
            >
              Resend
            </button>
          </p>
        )}

        
      </form>
    </motion.div>
  );
}

