"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminDashboard from '@/components/admin/AdminDashboard';
import GeneratedArticles from '@/components/admin/GeneratedArticles';
import CrawledArticles from '@/components/admin/CrawledArticles';
import CrawledUrls from '@/components/admin/CrawledUrls';
import { Menu } from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            router.push('/admin/login');
        } else {
            setIsLoading(false);
        }
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return <AdminDashboard />;
            case 'generated':
                return <GeneratedArticles />;
            case 'crawled':
                return <CrawledArticles />;
            case 'urls':
                return <CrawledUrls />;
            default:
                return <AdminDashboard />;
        }
    };

    return (
        <div className="flex min-h-screen bg-[#fafafa]">
            <AdminSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center px-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <span className="ml-4 font-bold text-[#ff4500]">FORHU Admin</span>
            </div>

            <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
                } p-8 pt-24 lg:pt-8 w-full`}>
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
