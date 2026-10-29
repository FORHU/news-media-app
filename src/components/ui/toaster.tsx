"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss delay. Errors default to longer so the recovery step can be read. */
  durationMs?: number;
  action?: { label: string; onClick: () => void };
};

type ToastItem = ToastOptions & { id: number };

// Module-level store so any code (event handlers, timers that outlive a
// component) can raise a toast without a provider hook.
let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(options: ToastOptions): number {
  const id = nextId++;
  items = [...items, { ...options, id }].slice(-4);
  emit();
  return id;
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => items;
const getServerSnapshot = (): ToastItem[] => [];

const VARIANT_ICON = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden />,
  error: <AlertCircle className="w-5 h-5 text-red-400" aria-hidden />,
  info: <Info className="w-5 h-5 text-sky-300" aria-hidden />,
} as const;

function ToastCard({ item }: { item: ToastItem }) {
    const reduceMotion = useReducedMotion();
    const [paused, setPaused] = React.useState(false);
    const variant = item.variant ?? "info";
    const duration = item.durationMs ?? (variant === "error" ? 8000 : 5000);

    React.useEffect(() => {
        if (paused) return;
        const t = setTimeout(() => dismissToast(item.id), duration);
        return () => clearTimeout(t);
    }, [paused, duration, item.id]);

    return (
        <motion.div
            layout={!reduceMotion}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            role={variant === "error" ? "alert" : "status"}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
            className="pointer-events-auto flex items-start gap-3 w-full sm:w-[380px] rounded-2xl bg-gray-900 text-white px-4 py-3.5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)] border border-white/10"
        >
            <span className="mt-0.5 shrink-0">{VARIANT_ICON[variant]}</span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug">{item.title}</p>
                {item.description ? (
                    <p className="mt-0.5 text-xs font-medium text-gray-300 leading-relaxed">{item.description}</p>
                ) : null}
            </div>
            {item.action ? (
                <button
                    type="button"
                    onClick={() => {
                        item.action?.onClick();
                        dismissToast(item.id);
                    }}
                    className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider text-orange-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-orange-300 transition-colors"
                >
                    {item.action.label}
                </button>
            ) : null}
            <button
                type="button"
                onClick={() => dismissToast(item.id)}
                aria-label="Dismiss notification"
                className="shrink-0 -mr-1 rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-orange-300 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

/** Mount once in the admin layout. */
export function Toaster() {
    const current = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    return (
        <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-stretch sm:items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
        >
            <AnimatePresence initial={false}>
                {current.map((item) => (
                    <ToastCard key={item.id} item={item} />
                ))}
            </AnimatePresence>
        </div>
    );
}
