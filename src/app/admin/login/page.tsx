"use client";

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Home } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { adminLoginSchema } from '@/lib/validation/login';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; general?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // No mount-time cleanup needed: the SSR browser client stores tokens in cookies,
    // so there is no stale localStorage to clear before login.

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

            // 3. Sign in via Supabase — the SSR browser client automatically stores
            //    the access + refresh tokens in cookies (not localStorage).
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                // Show specific messages for known Supabase error codes
                const msg = signInError.message?.toLowerCase() ?? '';
                if (msg.includes('rate') || msg.includes('too many')) {
                    setFieldErrors({ general: 'Too many login attempts. Please wait a moment and try again.' });
                } else if (msg.includes('email not confirmed')) {
                    setFieldErrors({ general: 'This account\'s email has not been confirmed. Please contact your administrator.' });
                } else {
                    setFieldErrors({ password: 'The password you entered is incorrect.' });
                }
                return;
            }

            // 4. Server-side role check — the session cookies from step 3 are sent
            //    automatically, so no accessToken body param is needed.
            //    On success, the server sets the admin-role=verified httpOnly cookie.
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

            // Validate redirectTo to prevent open redirect attacks.
            // Only allow internal paths (must start with '/').
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
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <Link
                href="/"
                className="fixed top-6 left-6 flex items-center gap-2 text-gray-700 hover:text-[#ff4500] transition-colors"
            >
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium">Back to Homepage</span>
            </Link>

            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">FORHU</h1>
                    <p className="text-gray-600">Admin Portal</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Admin email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#ff4500] focus:border-transparent outline-none text-gray-900 ${
                                    fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="admin@example.com"
                            />
                            {fieldErrors.email && (
                                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#ff4500] focus:border-transparent outline-none text-gray-900 ${
                                    fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Your admin password"
                            />
                            {fieldErrors.password && (
                                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.password}</p>
                            )}
                        </div>

                        {fieldErrors.general && (
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                                {fieldErrors.general}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-[#ff4500] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            <LogIn className="w-5 h-5" />
                            {isSubmitting ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-pulse text-gray-400 font-medium">Loading Portal...</div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
