"use client";

import React from 'react';
import {
    LayoutDashboard,
    FileText,
    Link as LinkIcon,
    Database,
    LogOut,
    ChevronLeft,
    ChevronRight,
    X,
    Users,
    Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface AdminSidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function AdminSidebar({
    sidebarOpen,
    setSidebarOpen
}: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const user = {
        name: "Admin User",
        email: "admin@forhu.com"
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        await fetch('/api/admin/auth/logout', { method: 'POST' });
        router.push('/admin/login');
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
        { id: 'generated', label: 'Generated Articles', icon: FileText, href: '/admin/dashboard/generated' },
        { id: 'urls', label: 'Crawl URLs', icon: LinkIcon, href: '/admin/dashboard/urls' },
        { id: 'crawled', label: 'Crawled Articles', icon: Database, href: '/admin/dashboard/crawled' },
        { id: 'banners', label: 'Banners', icon: ImageIcon, href: '/admin/dashboard/banners' },
        { id: 'accounts', label: 'Accounts', icon: Users, href: '/admin/dashboard/accounts' },
    ];

    return (
        <aside className={`bg-gradient-to-b from-black via-gray-900 to-black text-white flex-shrink-0 flex flex-col fixed left-0 top-0 bottom-0 shadow-2xl z-50 transition-all duration-300 h-full ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
            }`}>
            {/* Mobile Close Button */}
            <button
                onClick={() => setSidebarOpen(false)}
                className="absolute right-4 top-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-xl lg:hidden transition-colors z-20"
                title="Close sidebar"
            >
                <X className="w-5 h-5 text-white" />
            </button>

            {/* Toggle Button - Desktop only */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-br from-[#ff4500] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#ff4500] rounded-full transition-all duration-200 hidden lg:flex items-center justify-center shadow-lg hover:shadow-xl z-20 group"
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
                {sidebarOpen ? (
                    <ChevronLeft className="w-4 h-4 text-white transition-transform group-hover:scale-110" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-white transition-transform group-hover:scale-110" />
                )}
            </button>

            {/* Logo */}
            <div className={`p-6 border-b border-gray-800 flex-shrink-0 bg-gradient-to-r from-[#ff4500] to-[#ff6b35] transition-all duration-300 ${!sidebarOpen ? 'px-0 h-20 flex items-center justify-center' : 'px-6'
                }`}>
                <div className={`transition-all duration-300 ${!sidebarOpen ? 'text-center' : ''}`}>
                    <h1 className={`text-2xl font-bold tracking-tight transition-all duration-300 ${!sidebarOpen ? 'text-2xl leading-none' : ''
                        }`}>
                        {sidebarOpen ? 'FORHU' : 'F'}
                    </h1>
                    {sidebarOpen && (
                        <p className={`text-sm text-orange-100 mt-1 font-medium transition-all duration-300 opacity-100 h-auto`}>
                            Admin Portal
                        </p>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto scrollbar-hide">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => {
                                if (window.innerWidth < 1024) setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center transition-all duration-200 rounded-xl mb-2 group ${isActive
                                ? 'bg-gradient-to-r from-[#ff4500] to-[#ff6b35] text-white shadow-lg shadow-orange-500/50 scale-105'
                                : 'text-gray-300 hover:bg-gray-800/50 hover:scale-105'
                                } ${!sidebarOpen ? 'justify-center w-12 h-12 mx-auto p-0' : 'px-4 py-3 gap-3'}`}
                            title={!sidebarOpen ? item.label : ''}
                        >
                            <item.icon className={`${!sidebarOpen ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0 transition-transform ${isActive && !sidebarOpen ? 'scale-110' : ''}`} />
                            <span className={`font-medium whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                                }`}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Admin Details & Actions - Sticky at bottom */}
            <div className="p-4 border-t border-gray-800 bg-gradient-to-b from-black to-gray-900 flex-shrink-0 mt-auto">
                <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'opacity-100 max-h-40 mb-3' : 'opacity-0 max-h-0 mb-0 overflow-hidden'
                    }`}>
                    <div className="mb-3 p-3 bg-gray-800/50 rounded-lg backdrop-blur-sm border border-gray-700/30">
                        <p className="text-sm font-medium text-white line-clamp-1">{user?.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{user?.email}</p>
                    </div>
                    <Link
                        href="/"
                        className="block w-full text-center px-4 py-2.5 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 rounded-lg text-sm transition-all duration-200 font-medium shadow-md hover:shadow-lg text-white"
                    >
                        View Site
                    </Link>
                </div>
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center rounded-xl text-sm transition-all duration-300 ease-in-out font-bold shadow-md hover:shadow-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${sidebarOpen ? 'justify-center gap-2 px-4 py-3' : 'justify-center w-12 h-12 mx-auto p-0'
                        }`}
                    title={!sidebarOpen ? 'Logout' : ''}
                >
                    <LogOut className={`${!sidebarOpen ? 'w-6 h-6' : 'w-4 h-4'} flex-shrink-0`} />
                    <span className={`whitespace-nowrap transition-all duration-300 ease-in-out ${sidebarOpen ? 'opacity-100 max-w-[100px] ml-2' : 'opacity-0 max-w-0 overflow-hidden'
                        }`}>Logout</span>
                </button>
            </div>
        </aside>
    );
}
