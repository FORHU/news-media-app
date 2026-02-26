import { motion } from "framer-motion";
import { ChevronLeft, Check } from "lucide-react";

type CategoryOption = {
  id: number;
  name: string;
};

interface InterestsStepProps {
  categories: CategoryOption[];
  categoriesLoading: boolean;
  categoriesErrorMessage: string;
  selectedInterests: number[];
  otpSendError: string;
  isSendingOtp: boolean;
  onBack: () => void;
  onToggleInterest: (id: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function InterestsStep({
  categories,
  categoriesLoading,
  categoriesErrorMessage,
  selectedInterests,
  otpSendError,
  isSendingOtp,
  onBack,
  onToggleInterest,
  onSubmit,
  onCancel,
}: InterestsStepProps) {
  return (
    <motion.div
      key="interests"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6 max-h-60 sm:max-h-96 overflow-y-auto pr-2">
        {categories.map((category) => {
          const isSelected = selectedInterests.includes(category.id);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onToggleInterest(category.id)}
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
                    isSelected ? "text-[#ff4500]" : "text-gray-900"
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

      <p className="text-gray-500 mb-2 sm:mb-3 text-center text-[10px] sm:text-sm font-sans">
        Select topics to personalize your experience
      </p>
      {categoriesErrorMessage && (
        <p className="text-center text-[10px] sm:text-xs text-red-500 font-sans mb-2">
          {categoriesErrorMessage}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 sm:pt-4 pb-3 sm:pb-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 sm:gap-2 transition-colors font-sans"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Back
        </button>

        <div className="text-xs sm:text-sm text-gray-600 font-medium font-sans">
          {selectedInterests.length}{" "}
          {selectedInterests.length === 1 ? "category" : "categories"}
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={
            selectedInterests.length === 0 ||
            isSendingOtp ||
            categoriesLoading ||
            categories.length === 0
          }
          className={`flex-1 px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg transition-colors font-medium text-sm sm:text-base font-sans ${
            selectedInterests.length === 0 ||
            isSendingOtp ||
            categoriesLoading ||
            categories.length === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#ff4500] text-white hover:bg-[#e63e00]"
          }`}
        >
          {isSendingOtp ? "Sending code..." : "Next"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 sm:px-8 py-3 sm:py-3.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm sm:text-base font-sans"
        >
          Cancel
        </button>
      </div>

      {otpSendError && (
        <p className="mt-2 text-xs sm:text-sm text-red-500 font-sans">
          {otpSendError}
        </p>
      )}
    </motion.div>
  );
}

