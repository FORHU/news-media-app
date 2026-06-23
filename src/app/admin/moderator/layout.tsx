"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Globe2, LogOut, Sun, Moon, Newspaper } from "lucide-react";

const STATUS_TABS = [
    { label: "Pending",   value: "pending" },
    { label: "Draft",     value: "draft" },
    { label: "Published", value: "published" },
    { label: "Rejected",  value: "rejected" },
];

export default function ModeratorLayout({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") ?? "pending";

    const [name, setName] = useState("");
    const [dark, setDark] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // localStorage is client-only; reading it during render would mismatch
        // SSR output, so this must stay in an effect (hydration-safe mount flag).
        const saved = localStorage.getItem("moderator-dark");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDark(saved !== "false");
        setMounted(true);

        fetch("/api/admin/auth/session")
            .then((r) => r.json())
            .then((d) => { if (d.name) setName(d.name); })
            .catch(() => {});
    }, []);

    function toggleDark() {
        const next = !dark;
        setDark(next);
        localStorage.setItem("moderator-dark", String(next));
    }

    async function handleLogout() {
        await fetch("/api/admin/auth/logout", { method: "POST", credentials: "include" });
        window.location.assign("/admin/login");
    }

    if (!mounted) return null;

    return (
        <div className={dark ? "dark" : ""}>
            <div className="h-screen overflow-hidden flex flex-col md:flex-row bg-gray-50 dark:bg-zinc-950 transition-colors duration-200">

                {/* ── Desktop sidebar ──────────────────────────────────────── */}
                <aside className="hidden md:flex flex-col w-56 shrink-0 h-full bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800">

                    {/* Brand */}
                    <div className="px-5 pt-6 pb-5 border-b border-gray-100 dark:border-zinc-800 shrink-0">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                                <Newspaper className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-zinc-100 leading-none">Moderator</p>
                                <p className="text-[11px] font-black uppercase tracking-widest text-orange-500 leading-none mt-1">Panel</p>
                            </div>
                        </div>
                        {name && (
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase">{name.charAt(0)}</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium truncate">{name}</p>
                            </div>
                        )}
                    </div>

                    {/* Status filter tabs */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        <div className="flex items-center gap-2 px-2 pb-3">
                            <Globe2 className="w-3 h-3 text-orange-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-600">External Submissions</p>
                        </div>
                        {STATUS_TABS.map(({ label, value }) => {
                            const isActive = activeTab === value;
                            return (
                                <Link
                                    key={value}
                                    href={`/admin/moderator?tab=${value}`}
                                    className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${
                                        isActive
                                            ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                            : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100"
                                    }`}
                                >
                                    <span className={`flex items-center justify-center w-2 h-2 rounded-full shrink-0 transition-colors ${
                                        isActive ? "bg-orange-500 dark:bg-orange-400" : "bg-gray-200 dark:bg-zinc-700 group-hover:bg-gray-300 dark:group-hover:bg-zinc-600"
                                    }`} />
                                    <span className="tracking-wide">{label}</span>
                                    {isActive && <span className="ml-auto w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom actions */}
                    <div className="px-3 pb-5 pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-1 shrink-0">
                        <button onClick={toggleDark}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 transition-all">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800">
                                {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-400" />}
                            </span>
                            <span className="tracking-wide">{dark ? "Light Mode" : "Dark Mode"}</span>
                        </button>
                        <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-gray-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800">
                                <LogOut className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                            </span>
                            <span className="tracking-wide">Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* ── Mobile: top bar + status tabs ────────────────────────── */}
                <div className="md:hidden flex flex-col shrink-0 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-orange-500 flex items-center justify-center">
                                <Newspaper className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-zinc-100">Moderator</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={toggleDark} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                                {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                            </button>
                            <button onClick={handleLogout} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="flex overflow-x-auto border-t border-gray-100 dark:border-zinc-800 px-2 gap-1 py-1.5 no-scrollbar">
                        {STATUS_TABS.map(({ label, value }) => {
                            const isActive = activeTab === value;
                            return (
                                <Link
                                    key={value}
                                    href={`/admin/moderator?tab=${value}`}
                                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-colors ${
                                        isActive
                                            ? "bg-orange-500 text-white"
                                            : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                    }`}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* ── Main content ─────────────────────────────────────────── */}
                <main className="flex-1 min-h-0 overflow-y-auto">
                    <div className="w-full min-h-full px-6 md:px-10 py-8 flex flex-col">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}
