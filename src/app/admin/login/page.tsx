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
    }, []);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        // ... same logic
        e.preventDefault();
        setError(null);

        const parsed = adminLoginSchema.safeParse({ email, password });
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message ?? 'Invalid input.';
            setError(firstError);
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message || 'Invalid email or password.');
                return;
            }

            // Use the session returned directly from signInWithPassword — calling
            // getSession() right after can race against localStorage hydration and
            // return null even on a successful sign-in.
            const accessToken = signInData.session?.access_token;

            if (!accessToken) {
                setError('Unable to validate admin access. Please try again.');
                await supabase.auth.signOut();
                return;
            }

            const roleCheckResponse = await fetch('/api/admin/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken }),
            });

            if (!roleCheckResponse.ok) {
                setError('Access denied. Your account is not an admin.');
                await supabase.auth.signOut();
                return;
            }

            const redirectTo = searchParams.get('redirectTo');
            router.push(redirectTo || '/admin/dashboard');
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
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4500] focus:border-transparent outline-none text-gray-900"
                                placeholder="admin@example.com"
                            />
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
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4500] focus:border-transparent outline-none text-gray-900"
                                placeholder="Your admin password"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600">
                                {error}
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

