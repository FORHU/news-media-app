"use client";

import { ImageIcon, Sparkles, type LucideIcon } from "lucide-react";

function ChoiceCard({
  selected,
  disabled,
  onClick,
  icon: Icon,
  label,
  description,
}: {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-left rounded-2xl border-2 p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
        selected
          ? "border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
          : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            selected ? "bg-white shadow-sm" : "bg-white border border-gray-100"
          }`}
        >
          <Icon className={`w-4 h-4 ${selected ? "text-orange-600" : "text-gray-400"}`} />
        </div>
        <p className="text-xs font-black uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-xs font-medium leading-snug ${selected ? "text-white/80" : "text-gray-500"}`}>
        {description}
      </p>
    </button>
  );
}

interface FeaturedImageChoiceSectionProps {
  value: boolean;
  onChange: (generateNewImage: boolean) => void;
  disabled?: boolean;
  stepNumber?: string;
  stepLabel?: string;
  offLabel?: string;
  offDescription?: string;
  onLabel?: string;
  onDescription?: string;
  borderedTop?: boolean;
  /** When false, the "generate new image" option is disabled (e.g. no crawled thumbnail). */
  allowAiRemix?: boolean;
}

export default function FeaturedImageChoiceSection({
  value: generateNewImage,
  onChange,
  disabled = false,
  stepNumber = "03",
  stepLabel = "Featured Image",
  offLabel = "Keep source image",
  offDescription = "Use the crawled thumbnail when available. No new image is generated.",
  onLabel = "Generate new image",
  onDescription = "Create a fresh featured image from the generated article.",
  borderedTop = false,
  allowAiRemix = true,
}: FeaturedImageChoiceSectionProps) {
  return (
    <div className={`space-y-4 ${borderedTop ? "pt-4 border-t border-gray-100" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-600 font-black text-xs">
          {stepNumber}
        </span>
        <label className="text-sm font-black uppercase tracking-widest text-gray-900">
          {stepLabel}
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ChoiceCard
          selected={!generateNewImage}
          disabled={disabled}
          onClick={() => onChange(false)}
          icon={ImageIcon}
          label={offLabel}
          description={offDescription}
        />
        <ChoiceCard
          selected={generateNewImage}
          disabled={disabled || !allowAiRemix}
          onClick={() => onChange(true)}
          icon={Sparkles}
          label={onLabel}
          description={
            allowAiRemix
              ? onDescription
              : "Thumbnail must be an absolute https URL to use AI image remix."
          }
        />
      </div>
    </div>
  );
}
