"use client";

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Home } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { adminLoginSchema } from '@/lib/validation/login';

function LoginContent() {
    useEffect(() => {
        document.title = "Admin Login | FORHU";
        
        // Clear any stale session/cookie to prevent 400 Bad Request on expired tokens
        const cleanupSession = async () => {
            try {
                await supabase.auth.signOut();
                await fetch('/api/admin/auth/logout', { method: 'POST' });
            } catch (err) {
                console.error("Error clearing session on login mount:", err);
            }
        };
        cleanupSession();
    }, []);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                if (issue.path[0]) {
                    errors[issue.path[0] as string] = issue.message;
                }
            });
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);

        try {
            // 2. Pre-check: Verify email in database
            const verifyResponse = await fetch('/api/admin/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!verifyResponse.ok) {
                // If 403 (Forbidden) or 404/others, it means non-admin or non-existent
                if (verifyResponse.status === 403) {
                    router.replace('/');
                    return;
                }
                setFieldErrors({ general: 'Verification service unavailable. Please try again.' });
                return;
            }

            // 3. Supabase Auth
            // Ensure any stale session is cleared right before signing in, just in case
            await supabase.auth.signOut();
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                // Since email was verified, this is likely an invalid password
                setFieldErrors({ password: 'The password you entered is incorrect.' });
                return;
            }

            const accessToken = signInData.session?.access_token;

            if (!accessToken) {
                setFieldErrors({ general: 'Unable to validate admin access. Please try again.' });
                await supabase.auth.signOut();
                return;
            }

            // 4. Final Session Check (Sets Cookies)
            const roleCheckResponse = await fetch('/api/admin/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken }),
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
            router.push(redirectTo || '/admin/dashboard');
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

