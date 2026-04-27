"use client";

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Home, Mail, Lock, Eye, EyeOff, AlertCircle, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { adminLoginSchema } from '@/lib/validation/login';
import { motion, AnimatePresence } from 'framer-motion';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; general?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFieldErrors({});

        // 1. Zod Validation
        const parsed = adminLoginSchema.safeParse({ email, password });
        if (!parsed.success) {
            const errors: Record<string, string> = {};
            parsed.error.issues.forEach((issue) => {
                if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
            });
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);

        try {
            // 2. Pre-check: verify this email belongs to an admin in the database
            const verifyResponse = await fetch('/api/admin/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!verifyResponse.ok) {
                if (verifyResponse.status === 403) {
                    router.replace('/');
                    return;
                }
                setFieldErrors({ general: 'Verification service unavailable. Please try again.' });
                return;
            }

            // 3. Sign in via Supabase
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                const msg = signInError.message?.toLowerCase() ?? '';
                if (msg.includes('rate') || msg.includes('too many')) {
                    setFieldErrors({ general: 'Too many login attempts. Please wait a moment.' });
                } else if (msg.includes('email not confirmed')) {
                    setFieldErrors({ general: 'Email not confirmed. Please contact your admin.' });
                } else {
                    setFieldErrors({ password: 'The password you entered is incorrect.' });
                }
                return;
            }

            // 4. Server-side role check
            const roleCheckResponse = await fetch('/api/admin/auth/session', {
                method: 'POST',
            });

            if (!roleCheckResponse.ok) {
                await supabase.auth.signOut();
                if (roleCheckResponse.status === 403) {
                    router.replace('/');
                    return;
                }
                setFieldErrors({ general: 'Access denied. Your account is not an admin.' });
                return;
            }

            const redirectTo = searchParams.get('redirectTo');
            const safePath = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
                ? redirectTo
                : '/admin/dashboard';
            router.push(safePath);
        } catch (err) {
            console.error('Login error:', err);
            setFieldErrors({ general: 'An unexpected error occurred. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-orange-50 rounded-full blur-[100px] opacity-40" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-orange-50 rounded-full blur-[100px] opacity-30" />

            <Link
                href="/"
                className="fixed top-8 left-8 flex items-center gap-2 text-gray-800 hover:text-[#ff4500] transition-all duration-300 group z-10"
            >
                <div className="p-2 bg-white rounded-full shadow-sm border border-gray-200 group-hover:border-[#ff4500] group-hover:shadow-md transition-all">
                    <Home className="w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Back</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-block mb-3"
                    >
                        {/* Matching the NewsIcons orange bold logo style */}
                        <h1 className="text-5xl font-black text-[#ff4500] tracking-tighter uppercase">
                            NEWSICONS
                        </h1>
                    </motion.div>
                    <p className="text-gray-900 font-black text-[11px] uppercase tracking-[0.3em] opacity-80">Management Portal</p>
                </div>

                <div className="bg-white border-2 border-gray-50 rounded-[2.5rem] shadow-2xl shadow-orange-100/30 p-10 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-[#ff4500]" />

                    <div className="mb-10">
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Welcome Back</h2>
                        <p className="text-base text-gray-700 font-bold">Secure access for administrators.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-xs font-black text-gray-900 uppercase tracking-widest ml-1">
                                Admin Email
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#ff4500] transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full pl-11 pr-4 py-4 bg-gray-50 border-2 rounded-2xl focus:ring-0 focus:border-[#ff4500] outline-none text-gray-900 font-bold transition-all duration-300 ${fieldErrors.email ? 'border-red-500' : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                    placeholder="admin@forhu.com"
                                />
                                <AnimatePresence>
                                    {fieldErrors.email && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center gap-1.5 mt-2 ml-1 text-xs text-red-600 font-black"
                                        >
                                            <AlertCircle className="w-3 h-3" />
                                            {fieldErrors.email}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-xs font-black text-gray-900 uppercase tracking-widest ml-1">
                                Secure Token
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#ff4500] transition-colors">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full pl-11 pr-12 py-4 bg-gray-50 border-2 rounded-2xl focus:ring-0 focus:border-[#ff4500] outline-none text-gray-900 font-bold transition-all duration-300 ${fieldErrors.password ? 'border-red-500' : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#ff4500] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <AnimatePresence>
                                    {fieldErrors.password && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center gap-1.5 mt-2 ml-1 text-xs text-red-600 font-black"
                                        >
                                            <AlertCircle className="w-3 h-3" />
                                            {fieldErrors.password}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <AnimatePresence>
                            {fieldErrors.general && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-xs text-red-600 bg-red-50 p-4 rounded-2xl border-2 border-red-100 font-black flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {fieldErrors.general}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#ff4500] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#e63e00] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-xl shadow-orange-100 hover:shadow-orange-200 hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Authorize Access
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-10 text-gray-900 font-black text-[11px] uppercase tracking-[0.3em] opacity-40">
                    &copy; {new Date().getFullYear()} FORHU AI Technologies
                </p>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-pulse text-[#ff4500] font-black tracking-widest uppercase text-xs">Initializing Secure Portal...</div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
