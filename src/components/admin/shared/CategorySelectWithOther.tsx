"use client";

import React from "react";
import { Loader2, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { createCategorySchema } from "@/lib/validation/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  // Chinese
  "济州今日": "Jeju Today",
  "旅游资讯": "Travel & Tourism",
  "美食餐厅": "Food & Restaurants",
  "购物市场": "Shopping & Markets",
  "住宿信息": "Stay & Accommodation",
  "交通出行": "Getting Around",
  "活动节庆": "Events & Festivals",
  "自然户外": "Nature & Outdoors",
  "签证入境": "Visa & Entry Info",
  "本地商业生活": "Local Business & Living",
  
  // Japanese
  "済州今日": "Jeju Today",
  "旅行情報": "Travel & Tourism",
  "グルメ情報": "Food & Restaurants",
  "ショッピング": "Shopping & Markets",
  "宿泊情報": "Stay & Accommodation",
  "交通・移動": "Getting Around",
  "イベント・祭り": "Events & Festivals",
  "自然・アウトドア": "Nature & Outdoors",
  "ビザ・入国情報": "Visa & Entry Info",
  "ローカルビジネス・生活": "Local Business & Living",
};

function getDisplayCategoryName(name: string): string {
  const trimmed = name.trim();
  const translation = CATEGORY_TRANSLATIONS[trimmed];
  if (translation) {
    return `${trimmed} (${translation})`;
  }
  return trimmed;
}


interface CategorySelectWithOtherProps {
  value: string;
  onValueChange: (value: string) => void;
  categories: { id: string; name: string }[];
  isLoading?: boolean;
  placeholder?: string;
  label?: string;
  error?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export default function CategorySelectWithOther({
  value,
  onValueChange,
  categories,
  isLoading = false,
  placeholder = "Select Category",
  label = "Categories",
  error,
  triggerClassName,
  contentClassName,
}: CategorySelectWithOtherProps) {
  const queryClient = useQueryClient();
  const [isOtherMode, setIsOtherMode] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);

  const categoryOptions = React.useMemo(
    () => Array.from(new Map((categories ?? []).map((cat) => [cat.id, cat])).values()),
    [categories]
  );

  React.useEffect(() => {
    if (!isOtherMode) {
      setNewCategoryName("");
      setLocalError(null);
    }
  }, [isOtherMode]);

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => articlesApi.createCategory(name),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onValueChange(category.id);
      setIsOtherMode(false);
      setNewCategoryName("");
      setLocalError(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to create category";
      setLocalError(message);
    },
  });

  const handleCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    
    // Pre-flight validation using shared Zod schema
    const result = createCategorySchema.safeParse({ name: trimmed });
    
    if (!result.success) {
      setLocalError(result.error.issues[0].message);
      return;
    }
    
    // If validation passes, we use the transformed name (e.g. capitalized)
    createCategoryMutation.mutate(result.data.name);
  };

  if (isOtherMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={newCategoryName}
            onChange={(e) => {
              setNewCategoryName(e.target.value);
              if (localError) setLocalError(null);
            }}
            placeholder="Enter new category name"
            className={triggerClassName}
            disabled={createCategoryMutation.isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateCategory();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleCreateCategory}
            disabled={createCategoryMutation.isPending}
            className="h-10 rounded-xl"
          >
            {createCategoryMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOtherMode(false)}
            disabled={createCategoryMutation.isPending}
            className="h-10 rounded-xl"
          >
            Cancel
          </Button>
        </div>
        {(localError || error) && (
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">
            {localError || error}
          </p>
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
      disabled={isLoading}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        <SelectGroup>
          <SelectLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff4500] px-4 py-2 mt-2 border-b border-gray-50">
            {label}
          </SelectLabel>
          <SelectItem value={OTHER_OPTION_VALUE} className="font-black text-[#ff4500]">
            Other (Add New)
          </SelectItem>
          {categoryOptions.map((cat) => (
            <SelectItem key={cat.id} value={cat.id} className="pl-6 font-semibold">
              {getDisplayCategoryName(cat.name)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

