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
