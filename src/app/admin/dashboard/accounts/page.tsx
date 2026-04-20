"use client";

import React from 'react';
import { 
    Users, 
    UserPlus, 
    Mail, 
    Shield, 
    Calendar, 
    Search, 
    Loader2, 
    UserCheck,
    MoreVertical
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CreateAccountModal from '@/components/admin/accounts/CreateAccountModal';
import { format } from 'date-fns';
import { AdminUser } from '@/lib/types';

export default function AccountsPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    const { data: users, isLoading, isError } = useQuery<AdminUser[]>({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            const response = await fetch('/api/admin/accounts');
            if (!response.ok) throw new Error('Failed to fetch users');
            return response.json();
        }
    });

    const filteredUsers = users?.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <div className="space-y-8 min-h-screen pb-20 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#ff4500] font-bold text-xs uppercase tracking-widest mb-1">
                        <Shield className="w-4 h-4" />
                        System Security
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Admin <span className="text-[#ff4500]">Accounts</span>
                    </h1>
                    <p className="text-gray-500 font-medium text-lg">
                        Manage administrative access and system permissions.
                    </p>
                </div>

                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-14 px-8 rounded-2xl bg-black hover:bg-gray-800 text-white font-bold text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" />
                    Create Admin Account
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 flex items-center gap-4 sticky top-4 z-10">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#ff4500] transition-colors" />
                    <Input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 w-full pl-12 pr-4 rounded-2xl bg-gray-50/50 border-gray-100 text-sm focus-visible:ring-orange-500/20 focus-visible:border-orange-200"
                    />
                </div>
            </div>

            {/* User List */}
            {isLoading ? (
                <div className="py-32 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-[#ff4500] animate-spin mb-4" />
                    <p className="text-gray-500 font-bold">Loading security audit...</p>
                </div>
            ) : isError ? (
                <div className="py-32 text-center text-red-500 bg-red-50 rounded-[3rem] border-2 border-dashed border-red-100 font-bold">
                    Failed to load accounts. Please check your permissions.
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredUsers && filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <motion.div
                                key={user.id}
                                variants={itemVariants}
                                whileHover={{ y: -5, scale: 1.01 }}
                                className="group bg-white rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 border border-gray-100 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#ff4500]/5 transition-colors">
                                        <Users className="w-7 h-7 text-gray-400 group-hover:text-[#ff4500] transition-colors" />
                                    </div>
                                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-1.5">
                                        <UserCheck className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">{user.role}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 leading-none mb-1">
                                            {user.firstName} {user.lastName}
                                        </h3>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="text-sm font-medium">{user.email}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold uppercase tracking-tight">
                                                Joined {format(new Date(user.createdAt), 'MMM yyyy')}
                                            </span>
                                        </div>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-900">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                            <Users className="w-16 h-16 text-gray-100 mb-4" />
                            <p className="text-gray-400 font-bold text-lg">No accounts found matching your search.</p>
                        </div>
                    )}
                </motion.div>
            )}

            <CreateAccountModal 
                open={isCreateModalOpen} 
                onOpenChange={setIsCreateModalOpen} 
            />
        </div>
    );
}
