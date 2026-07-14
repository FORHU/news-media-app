import { CheckCircle2, XCircle } from "lucide-react";
import type { PublishStatus } from "@/types/socialPublishing";

export function StatusBadge({ status }: { status: PublishStatus }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border bg-green-50 text-green-600 border-green-100">
        <CheckCircle2 className="w-2.5 h-2.5" />Published
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border bg-red-50 text-red-600 border-red-100">
        <XCircle className="w-2.5 h-2.5" />Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border bg-gray-100 text-gray-500 border-gray-200">
      Not Posted
    </span>
  );
}
