"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false); // Default to false for mobile first
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initDashboard = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error || !data.session) {
                router.push('/admin/login');
                return;
            }

            // Sync initial sidebar state without brittle listeners
            setSidebarOpen(window.matchMedia('(min-width: 1024px)').matches);
            setIsLoading(false);
        };

        void initDashboard();
    }, [router]);


    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <AdminLayout
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
        >
            {children}
        </AdminLayout>
    );
}
