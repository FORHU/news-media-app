"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export default function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  itemLabel = "item",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-between pt-1">
      <p className="text-xs text-gray-400 font-medium">
        {total} {itemLabel}{total !== 1 ? "s" : ""}
      </p>

      <div className="flex items-center gap-1">
        {/* First */}
        <NavButton
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          title="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </NavButton>

        {/* Prev */}
        <NavButton
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </NavButton>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pages.map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="w-8 h-8 flex items-center justify-center text-xs text-gray-400 font-bold select-none"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                  p === page
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <NavButton
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          title="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </NavButton>

        {/* Last */}
        <NavButton
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          title="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </NavButton>
      </div>
    </div>
  );
}

function NavButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
    >
      {children}
    </button>
  );
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [];

  // Always show first
  pages.push(1);

  if (current > 3) pages.push("...");

  // Window around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (current < total - 2) pages.push("...");

  // Always show last
  pages.push(total);

  return pages;
}
