"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // matchMedia is unavailable during SSR. A lazy useState initializer would
    // branch on `window` during the client's hydration render and mismatch the
    // server-rendered HTML, so this must run in an effect, after hydration.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSidebarOpen(window.matchMedia('(min-width: 1024px)').matches);
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
