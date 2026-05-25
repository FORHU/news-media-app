"use client";

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    FileText,
    Link as LinkIcon,
    Database,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    X,
    Users,
    Image as ImageIcon,
    Globe2
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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

    // Bug #5 fix: load the real logged-in admin's info from the live Supabase session
    const [user, setUser] = useState<{ name: string; email: string }>({ name: 'Admin User', email: '' });

    useEffect(() => {
        const loadUser = async () => {
            const res = await fetch('/api/admin/auth/session');
            if (res.ok) {
                const data = await res.json();
                setUser({ name: data.name || data.email?.split('@')[0] || 'Admin User', email: data.email ?? '' });
            }
        };
        void loadUser();
    }, []);

    const handleLogout = async () => {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
        router.replace('/admin/login');
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
        { id: 'generated', label: 'Generated Articles', icon: FileText, href: '/admin/dashboard/generated' },
        { id: 'external', label: 'External Submissions', icon: Globe2, href: '/admin/dashboard/external' },
        {
            id: 'crawl',
            label: 'Content Sourcing',
            icon: LinkIcon,
            subSections: [
                {
                    label: 'Web Scraping',
                    items: [
                        { label: 'Manage Targets', href: '/admin/dashboard/urls' },
                        { label: 'Raw Articles', href: '/admin/dashboard/crawled' },
                    ]
                },
                {
                    label: 'X Monitoring',
                    items: [
                        { label: 'X Feed Sources', href: '/admin/dashboard/x/urls' },
                    ]
                },
                {
                    label: 'YouTube Conversion',
                    items: [
                        { label: 'Transcribe', href: '/admin/dashboard/youtube' },
                    ]
                }
            ]
        },
        { id: 'banners', label: 'Banners', icon: ImageIcon, href: '/admin/dashboard/banners' },
        { id: 'accounts', label: 'Accounts', icon: Users, href: '/admin/dashboard/accounts' },
    ];

    const [expandedMenus, setExpandedMenus] = useState<string[]>(['crawl']);
    const [expandedSubSections, setExpandedSubSections] = useState<string[]>([]);

    const toggleMenu = (id: string) => {
        setExpandedMenus(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const toggleSubSection = (label: string) => {
        setExpandedSubSections(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

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
                    const hasSubItems = item.subSections && item.subSections.length > 0;
                    const isExpanded = expandedMenus.includes(item.id);
                    const isActive = item.href ? pathname === item.href : item.subSections?.some(s => s.items.some(si => pathname === si.href));

                    return (
                        <div key={item.id} className="mb-2">
                            {item.href ? (
                                <Link
                                    href={item.href}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) setSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center transition-all duration-200 rounded-xl group ${isActive
                                        ? 'bg-gradient-to-r from-[#ff4500] to-[#ff6b35] text-white shadow-lg shadow-orange-500/50 scale-105'
                                        : 'text-gray-300 hover:bg-gray-800/50 hover:scale-105'
                                        } ${!sidebarOpen ? 'justify-center w-12 h-12 mx-auto p-0' : 'px-4 py-3 gap-3'}`}
                                    title={!sidebarOpen ? item.label : ''}
                                >
                                    <item.icon className={`${!sidebarOpen ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0 transition-transform ${isActive && !sidebarOpen ? 'scale-110' : ''}`} />
                                    <span className={`font-medium whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                                        }`}>{item.label}</span>
                                </Link>
                            ) : (
                                <div className="flex flex-col">
                                    <button
                                        onClick={() => {
                                            if (sidebarOpen) {
                                                toggleMenu(item.id);
                                            } else {
                                                setSidebarOpen(true);
                                                if (!isExpanded) toggleMenu(item.id);
                                            }
                                        }}
                                        className={`w-full flex items-center transition-all duration-200 rounded-xl group ${isActive && !isExpanded
                                            ? 'bg-gradient-to-r from-[#ff4500] to-[#ff6b35] text-white shadow-lg shadow-orange-500/50 scale-105'
                                            : 'text-gray-300 hover:bg-gray-800/50 hover:scale-105'
                                            } ${!sidebarOpen ? 'justify-center w-12 h-12 mx-auto p-0' : 'px-4 py-3 gap-3'}`}
                                        title={!sidebarOpen ? item.label : ''}
                                    >
                                        <item.icon className={`${!sidebarOpen ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                                        <span className={`font-medium whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                                            }`}>{item.label}</span>
                                        {sidebarOpen && (
                                            <div className="ml-auto">
                                                {isExpanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                                            </div>
                                        )}
                                    </button>

                                    {/* Sub Sections */}
                                    {sidebarOpen && isExpanded && item.subSections && (
                                        <div className="mt-2 ml-4 flex flex-col gap-2 border-l border-gray-700 pl-4 py-1">
                                            {item.subSections.map((section, sIdx) => {
                                                const isSubExpanded = expandedSubSections.includes(section.label);
                                                return (
                                                    <div key={sIdx} className="mb-2 last:mb-0">
                                                        <button
                                                            onClick={() => toggleSubSection(section.label)}
                                                            className="w-full flex items-center justify-between px-2 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-white hover:bg-gray-800/50 rounded-lg transition-all"
                                                        >
                                                            <span>{section.label}</span>
                                                            {isSubExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                        </button>
                                                        
                                                        {isSubExpanded && (
                                                            <div className="flex flex-col gap-1 mt-1 ml-2 border-l border-gray-700 pl-3">
                                                                {section.items.map((subItem, siIdx) => {
                                                                    const isSubActive = pathname === subItem.href;
                                                                    return (
                                                                        <Link
                                                                            key={siIdx}
                                                                            href={subItem.href}
                                                                            onClick={() => {
                                                                                if (window.innerWidth < 1024) setSidebarOpen(false);
                                                                            }}
                                                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isSubActive
                                                                                ? 'text-orange-500 font-bold bg-orange-500/10'
                                                                                : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                                                                                }`}
                                                                        >
                                                                            {subItem.label}
                                                                        </Link>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
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
