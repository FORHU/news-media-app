"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Home } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { adminLoginSchema } from '@/lib/validation/login';

export default function LoginPage() {
    useEffect(() => {
        document.title = "Admin Login | FORHU";
    }, []);

    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const parsed = adminLoginSchema.safeParse({ email, password });
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message ?? 'Invalid input.';
            setError(firstError);
            return;
        }

        setIsSubmitting(true);

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setIsSubmitting(false);

        if (signInError) {
            setError(signInError.message || 'Invalid email or password.');
            return;
        }

        router.push('/admin/dashboard');
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

