"use client";

import React from "react";
import { GENERAL_CATEGORIES } from "@/config/generalCategories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OTHER_OPTION_VALUE = "__other__";

/**
 * Category picker for the General Publish tab. Unlike CategorySelectWithOther
 * (tenant-scoped Category ids), this is a plain name string — the fixed
 * GENERAL_CATEGORIES list, or a free-typed "Other" value — since a broadcast
 * isn't tied to any one tenant's taxonomy. The chosen name gets find-or-created
 * as a real Category row per target tenant at publish time.
 */
export default function GeneralCategorySelect({
  value,
  onValueChange,
  placeholder = "Select Category",
  triggerClassName,
  contentClassName,
  error,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  contentClassName?: string;
  error?: string;
}) {
  const isKnown = (GENERAL_CATEGORIES as readonly string[]).includes(value);
  const [isOtherMode, setIsOtherMode] = React.useState(value.length > 0 && !isKnown);
  const [otherValue, setOtherValue] = React.useState(isOtherMode ? value : "");

  if (isOtherMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={otherValue}
            onChange={(e) => {
              setOtherValue(e.target.value);
              onValueChange(e.target.value);
            }}
            placeholder="Enter category name"
            className={triggerClassName}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsOtherMode(false);
              setOtherValue("");
              onValueChange("");
            }}
            className="h-10 rounded-xl"
          >
            Cancel
          </Button>
        </div>
        {error && (
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">{error}</p>
        )}
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue === OTHER_OPTION_VALUE) {
          setIsOtherMode(true);
          return;
        }
        onValueChange(nextValue);
      }}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        <SelectGroup>
          <SelectLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff4500] px-4 py-2 mt-2 border-b border-gray-50">
            General Categories
          </SelectLabel>
          <SelectItem value={OTHER_OPTION_VALUE} className="font-black text-[#ff4500]">
            Other (Custom)
          </SelectItem>
          {GENERAL_CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat} className="pl-6 font-semibold">
              {cat}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
