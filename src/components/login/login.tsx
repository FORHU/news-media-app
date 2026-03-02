"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Home } from 'lucide-react';

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Set basic session flag
        localStorage.setItem('isLoggedIn', 'true');
        // Accept any email and password - redirect to dashboard
        router.push('/admin/dashboard');
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            {/* Back to Homepage Button - Top Left */}
            <Link
                href="/"
                className="fixed top-6 left-6 flex items-center gap-2 text-gray-700 hover:text-[#ff4500] transition-colors"
            >
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium">Back to Homepage</span>
            </Link>

            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">FORHU</h1>
                    <p className="text-gray-600">Admin Portal</p>
                </div>

                {/* Login Form */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4500] focus:border-transparent outline-none text-gray-900"
                                placeholder="admin@forhu.com"
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
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-[#ff4500] transition-colors flex items-center justify-center gap-2"
                        >
                            <LogIn className="w-5 h-5" />
                            Sign In
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600 text-center">
                            Enter any credentials to access the dashboard
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
