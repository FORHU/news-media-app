"use client";

import React from "react";
import { Loader2, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
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
    if (!trimmed) {
      setLocalError("Please enter a category name.");
      return;
    }
    createCategoryMutation.mutate(trimmed);
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
              {cat.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

