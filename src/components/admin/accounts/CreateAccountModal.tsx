"use client";

import React from "react";
import {
    X,
    UserPlus,
    Loader2,
    Shield,
    User,
    Mail,
    Lock,
    AlertCircle,
    Check,
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

interface CreateAccountModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateAccountModal({
    open,
    onOpenChange,
}: CreateAccountModalProps) {
    const queryClient = useQueryClient();

    // ── form state ──
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    
    const [error, setError] = React.useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

    // reset when open changes
    React.useEffect(() => {
        if (open) {
            setFirstName("");
            setLastName("");
            setEmail("");
            setPassword("");
            setError(null);
            setFieldErrors({});
        }
    }, [open]);

    // ── validation ──
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!firstName.trim()) newErrors.firstName = "First name is required";
        if (!lastName.trim()) newErrors.lastName = "Last name is required";
        if (!email.trim() || !email.includes("@")) newErrors.email = "Valid email is required";
        if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
        
        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ── mutation ──
    const mutation = useMutation({
        mutationFn: async () => {
            setError(null);
            const response = await fetch('/api/admin/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create account');
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            onOpenChange(false);
        },
        onError: (err: any) => {
            setError(err.message || "Something went wrong.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            mutation.mutate();
        }
    };

    const isBusy = mutation.isPending;

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
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff4500] to-[#ff6b35] flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                New Admin Account
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 text-sm font-medium">
                                Create a new administrator for the system.
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
                            <Mail className="w-3 h-3" /> Email Address
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@forhu.com"
                            className={`h-11 rounded-xl bg-white border-gray-200 text-sm focus-visible:ring-orange-500/20 ${fieldErrors.email ? 'border-red-500' : ''}`}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <Lock className="w-3 h-3" /> Password
                        </label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 8 characters"
                            className={`h-11 rounded-xl bg-white border-gray-200 text-sm focus-visible:ring-orange-500/20 ${fieldErrors.password ? 'border-red-500' : ''}`}
                        />
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
                                "Create Account"
                            )}
                        </Button>
                    </div>
                </form>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        New accounts are created with <span className="text-[#ff4500]">Admin</span> privileges by default.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
