"use client";

import React from "react";
import {
    X,
    UserCircle,
    Loader2,
    Shield,
    User,
    Lock,
    AlertCircle,
    Eye,
    EyeOff,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminUser } from "@/lib/types";

interface EditAccountModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: AdminUser | null;
    onSuccess?: () => void;
}

export default function EditAccountModal({
    open,
    onOpenChange,
    user,
    onSuccess,
}: EditAccountModalProps) {
    const queryClient = useQueryClient();

    // ── form state ──
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    
    const [error, setError] = React.useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

    // reset when open or user changes — during render, no effect.
    const [prevDeps, setPrevDeps] = React.useState({ open, user });
    if (open !== prevDeps.open || user !== prevDeps.user) {
        setPrevDeps({ open, user });
        if (open && user) {
            setFirstName(user.firstName);
            setLastName(user.lastName);
            setPassword("");
            setConfirmPassword("");
            setShowPassword(false);
            setShowConfirmPassword(false);
            setError(null);
            setFieldErrors({});
        }
    }

    // ── validation ──
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!firstName.trim()) newErrors.firstName = "First name is required";
        if (!lastName.trim()) newErrors.lastName = "Last name is required";
        
        if (password) {
            if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
            if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
        }
        
        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ── mutation ──
    const mutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error("No user selected");
            setError(null);
            
            const payload: { id: string; firstName: string; lastName: string; password?: string } = { id: user.id, firstName, lastName };
            if (password) payload.password = password;

            const response = await fetch('/api/admin/accounts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update account');
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            onOpenChange(false);
            if (onSuccess) onSuccess();
        },
        onError: (err: unknown) => {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            mutation.mutate();
        }
    };

    const isBusy = mutation.isPending;

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="w-[95vw] sm:max-w-[500px] p-0 overflow-hidden rounded-[2rem] border-none bg-white shadow-2xl"
            >
                {/* ── header ── */}
                <div className="relative bg-black px-6 sm:px-8 py-7 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff4500]/10 blur-[80px] -mr-32 -mt-32 pointer-events-none" />

                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all z-20"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="relative flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff4500] to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <UserCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                Edit Account
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 text-sm font-medium">
                                Update administrator details. Leave password blank to keep current.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* ── form ── */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 bg-gray-50/40">
                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-bold">Error</p>
                                <p className="text-xs opacity-80 mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <User className="w-3 h-3" /> First Name
                            </label>
                            <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className={`h-11 rounded-xl bg-white border-gray-200 text-sm focus-visible:ring-orange-500/20 ${fieldErrors.firstName ? 'border-red-500' : ''}`}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <User className="w-3 h-3" /> Last Name
                            </label>
                            <Input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className={`h-11 rounded-xl bg-white border-gray-200 text-sm focus-visible:ring-orange-500/20 ${fieldErrors.lastName ? 'border-red-500' : ''}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <Lock className="w-3 h-3" /> New Password (Optional)
                        </label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 8 characters"
                                className={`h-11 rounded-xl bg-white border-gray-200 text-sm focus-visible:ring-orange-500/20 pr-10 ${fieldErrors.password ? 'border-red-500' : ''}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {fieldErrors.password && <p className="text-xs text-red-500 font-bold">{fieldErrors.password}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <Lock className="w-3 h-3" /> Confirm New Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your new password"
                                className={`h-11 rounded-xl bg-white border-gray-200 text-sm focus-visible:ring-orange-500/20 pr-10 ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {fieldErrors.confirmPassword && <p className="text-xs text-red-500 font-bold">{fieldErrors.confirmPassword}</p>}
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 rounded-xl font-bold h-12"
                            disabled={isBusy}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isBusy}
                            className="flex-[2] rounded-xl font-black h-12 bg-[#ff4500] hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                        >
                            {isBusy ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Editing for <span className="text-gray-900">{user.email}</span>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
