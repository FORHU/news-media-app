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
        const checkWindowSize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        // Check on initial load
        checkWindowSize();

        // Optional: Add resize listener if you want it to react to window resizing
        // window.addEventListener('resize', checkWindowSize);
        // return () => window.removeEventListener('resize', checkWindowSize);
    }, []);

    useEffect(() => {
        const checkSession = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error || !data.session) {
                router.push('/admin/login');
                return;
            }

            setIsLoading(false);
        };

        void checkSession();
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
