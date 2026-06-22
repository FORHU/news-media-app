"use client";

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ActiveCrawlIndicator from '@/components/admin/ActiveCrawlIndicator';
import { ArticleStreamProvider } from '@/providers/ArticleStreamProvider';
import { Menu } from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function AdminLayout({
    children,
    sidebarOpen,
    setSidebarOpen
}: AdminLayoutProps) {
    return (
        <ArticleStreamProvider>
        <div className="flex min-h-screen bg-[#fafafa]">
            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <AdminSidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-30 flex items-center px-4 justify-between">
                <div className="flex items-center">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="ml-3 font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff4500] to-[#ff6b35]">
                        FORHU Admin
                    </span>
                </div>
            </header>

            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
                } px-4 md:p-8 pt-20 lg:pt-8 w-full`}>
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
            <ActiveCrawlIndicator />
        </div>
        </ArticleStreamProvider>
    );
}
