"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        // The middleware already guarantees that any request reaching this layout
        // is authenticated (valid Supabase session + admin-role cookie).
        // No client-side session re-check is needed here.
        setSidebarOpen(window.matchMedia('(min-width: 1024px)').matches);
    }, []); // empty — only needs to run once on mount to set initial sidebar width

    return (
        <AdminLayout
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
        >
            {children}
        </AdminLayout>
    );
}
