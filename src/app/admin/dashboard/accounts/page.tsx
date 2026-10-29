"use client";

import React from 'react';
import { UserPlus, Search, Pencil, Trash2, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import CreateAccountModal from '@/components/admin/accounts/CreateAccountModal';
import EditAccountModal from '@/components/admin/accounts/EditAccountModal';
import ConfirmationModal from '@/components/admin/shared/ConfirmationModal';
import { AdminUser } from '@/lib/types';

const displayName = (user: AdminUser) =>
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

const initials = (user: AdminUser) => {
    const letters = `${(user.firstName ?? '').charAt(0)}${(user.lastName ?? '').charAt(0)}`;
    return (letters || user.email.charAt(0)).toUpperCase();
};

const roleLabel = (role: string) => role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

export default function AccountsPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [userToDelete, setUserToDelete] = React.useState<AdminUser | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [currentUserEmail, setCurrentUserEmail] = React.useState<string | null>(null);
    const queryClient = useQueryClient();

    React.useEffect(() => {
        const getMe = async () => {
            try {
                const res = await fetch('/api/admin/auth/session');
                if (res.ok) {
                    const data = await res.json();
                    setCurrentUserEmail(data.email ?? null);
                }
            } catch {
                // Without the session email the self-delete guard simply isn't shown; the server still enforces it.
            }
        };
        getMe();
    }, []);

    const { data: users, isLoading, isError, refetch } = useQuery<AdminUser[]>({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            const response = await fetch('/api/admin/accounts');
            if (!response.ok) throw new Error('Failed to fetch users');
            return response.json();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch('/api/admin/accounts', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error('Failed to delete user');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            toast({ variant: 'success', title: 'Account deleted' });
        },
        onError: () => {
            toast({
                variant: 'error',
                title: "Couldn't delete the account",
                description: 'Nothing was changed. Please try again.',
            });
        },
    });

    const handleEdit = (user: AdminUser) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (user: AdminUser) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const query = searchQuery.trim().toLowerCase();
    const filteredUsers = users?.filter(user =>
        user.email?.toLowerCase().includes(query) ||
        (user.firstName || "").toLowerCase().includes(query) ||
        (user.lastName || "").toLowerCase().includes(query)
    );
    const total = users?.length ?? 0;
    const shown = filteredUsers?.length ?? 0;

    return (
        <div className="space-y-8 min-h-screen pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Admin <span className="text-[#ff4500]">Accounts</span>
                    </h1>
                    <p className="text-gray-600 font-medium text-lg">
                        Manage administrative access and system permissions.
                    </p>
                </div>

                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-12 px-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm shadow-sm flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" aria-hidden />
                    Create Admin Account
                </Button>
            </div>

            <section aria-label="Admin accounts" className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 md:p-5 border-b border-gray-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden />
                        <Input
                            type="search"
                            aria-label="Search accounts by name or email"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 w-full pl-11 pr-4 rounded-xl bg-gray-50 border-gray-100 text-sm focus-visible:ring-orange-500/20 focus-visible:border-orange-300"
                        />
                    </div>
                    {users ? (
                        <p aria-live="polite" className="text-sm font-semibold text-gray-600 shrink-0">
                            {query ? `${shown} of ${total} accounts` : `${total} ${total === 1 ? 'account' : 'accounts'}`}
                        </p>
                    ) : null}
                </div>

                {isLoading ? (
                    <ul aria-busy="true" aria-label="Loading accounts" className="divide-y divide-gray-100">
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="flex items-center gap-4 px-5 md:px-6 py-5 animate-pulse">
                                <div className="w-11 h-11 rounded-full bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-40 rounded bg-gray-200" />
                                    <div className="h-3 w-56 rounded bg-gray-200" />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : isError ? (
                    <div role="alert" className="py-16 px-6 text-center">
                        <p className="text-base font-bold text-gray-900">Couldn&apos;t load accounts.</p>
                        <p className="text-sm text-gray-600 mt-1">Check your connection and permissions, then try again.</p>
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            className="mt-4 rounded-xl font-bold border-gray-200"
                        >
                            Try again
                        </Button>
                    </div>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                        {filteredUsers.map((user) => {
                            const name = displayName(user);
                            const isSelf = user.email === currentUserEmail;
                            return (
                                <li
                                    key={user.id}
                                    className="flex flex-wrap md:flex-nowrap items-center gap-x-4 gap-y-3 px-5 md:px-6 py-4 hover:bg-gray-50/70 transition-colors"
                                >
                                    <div
                                        aria-hidden
                                        className="w-11 h-11 shrink-0 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-black"
                                    >
                                        {initials(user)}
                                    </div>

                                    <div className="min-w-0 flex-1 basis-48">
                                        <p className="flex items-center gap-2 text-base font-bold text-gray-900">
                                            <span className="truncate">{name}</span>
                                            {isSelf ? (
                                                <span className="shrink-0 rounded-md bg-orange-50 text-orange-800 border border-orange-200 px-1.5 py-0.5 text-[11px] font-bold">
                                                    You
                                                </span>
                                            ) : null}
                                        </p>
                                        <p className="text-sm font-medium text-gray-600 truncate">{user.email}</p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                                            user.role.toLowerCase() === 'admin'
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {roleLabel(user.role)}
                                    </span>

                                    <p className="hidden md:block shrink-0 w-28 text-sm font-medium text-gray-600">
                                        Joined{' '}
                                        <time dateTime={new Date(user.createdAt).toISOString()}>
                                            {format(new Date(user.createdAt), 'MMM yyyy')}
                                        </time>
                                    </p>

                                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(user)}
                                            aria-label={`Edit ${name}`}
                                            title="Edit account"
                                            className="rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteClick(user)}
                                            disabled={isSelf}
                                            aria-label={isSelf ? `${name} (you) can't be deleted` : `Delete ${name}`}
                                            title={isSelf ? 'You cannot delete yourself' : 'Delete account'}
                                            className="rounded-xl text-gray-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-40"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="py-20 px-6 flex flex-col items-center text-center">
                        <Users className="w-10 h-10 text-gray-300 mb-3" aria-hidden />
                        {query ? (
                            <>
                                <p className="text-base font-bold text-gray-900">No accounts match &ldquo;{searchQuery.trim()}&rdquo;.</p>
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="mt-2 text-xs font-black uppercase tracking-wider text-orange-700 hover:text-orange-800 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                                >
                                    Clear search
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-base font-bold text-gray-900">No admin accounts yet.</p>
                                <p className="text-sm text-gray-600 mt-1">Create one to give someone access to the admin portal.</p>
                            </>
                        )}
                    </div>
                )}
            </section>

            <CreateAccountModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={() => toast({ variant: 'success', title: 'New admin account created' })}
            />

            <EditAccountModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                user={selectedUser}
                onSuccess={() => toast({ variant: 'success', title: 'Account updated' })}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                onConfirm={() => {
                    if (userToDelete?.id) {
                        deleteMutation.mutate(userToDelete.id);
                    }
                }}
                title="Delete Admin Account?"
                description={`This action cannot be undone. ${userToDelete ? displayName(userToDelete) : 'This person'} will lose all administrative access.`}
                confirmText="Yes, Delete"
                variant="destructive"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
