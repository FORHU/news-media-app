"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/admin/AdminLayout';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        // The middleware guarantees that any request reaching this layout is authenticated.
        // However, we add a client-side listener to handle session expiration or sign-outs
        // that happen while the user is actively viewing the dashboard.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                // If the session is lost, force a refresh or redirect.
                // The middleware will then handle the official redirect to /admin/login.
                window.location.href = '/admin/login';
            }
        });

        setSidebarOpen(window.matchMedia('(min-width: 1024px)').matches);

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AdminLayout
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
        >
            {children}
        </AdminLayout>
    );
}
