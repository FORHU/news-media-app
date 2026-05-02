"use client";

import React, { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ChevronRight, Home } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { adminLoginSchema } from '@/lib/validation/login';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Domain theme config ─── */
type Theme = {
  bg: string;
  card: string;
  topBar: string;
  logo: React.ReactNode;
  accent: string;          // tailwind arbitrary e.g. "#ff4500"
  accentCls: string;       // tailwind class for bg
  accentHover: string;
  inputFocus: string;
  inputBorder: string;
  labelCls: string;
  btnCls: string;
  errorCls: string;
  backCls: string;
  tagline: string;
  footerText: string;
  siteName: string;
  fontStyle?: string;
};

function useTheme(): Theme {
  const [domain, setDomain] = useState('');
  useEffect(() => { setDomain(window.location.hostname); }, []);

  if (domain.includes('jejujapan')) return jejuJapanTheme;
  if (domain.includes('jejuqq'))   return jejuQQTheme;
  if (domain.includes('jejutime')) return jejuTimeTheme;
  return newsIconsTheme;
}

/* ── NewsIcons ── */
const newsIconsTheme: Theme = {
  bg: 'min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden',
  card: 'bg-white border-2 border-gray-50 rounded-[2.5rem] shadow-2xl shadow-orange-100/30 p-10 md:p-12 relative overflow-hidden',
  topBar: 'absolute top-0 left-0 w-full h-1.5 bg-[#ff4500]',
  logo: (
    <div className="text-center mb-12">
      <h1 className="text-5xl font-black text-[#ff4500] tracking-tighter uppercase">NEWSICONS</h1>
      <p className="text-gray-900 font-black text-[11px] uppercase tracking-[0.3em] opacity-80 mt-2">Management Portal</p>
    </div>
  ),
  accent: '#ff4500',
  accentCls: 'bg-[#ff4500]',
  accentHover: 'hover:bg-[#e63e00]',
  inputFocus: 'focus:border-[#ff4500]',
  inputBorder: 'border-gray-100 hover:border-gray-200',
  labelCls: 'text-xs font-black text-gray-900 uppercase tracking-widest',
  btnCls: 'w-full bg-[#ff4500] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#e63e00] disabled:opacity-60 transition-all shadow-xl shadow-orange-100 hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden',
  errorCls: 'text-xs text-red-600 bg-red-50 p-4 rounded-2xl border-2 border-red-100 font-black flex items-center gap-3',
  backCls: 'fixed top-8 left-8 flex items-center gap-2 text-gray-800 hover:text-[#ff4500] transition-all group z-10',
  tagline: 'Welcome Back',
  footerText: '© FORHU AI Technologies',
  siteName: 'NewsIcons',
};

/* ── JejuJapan ── */
const jejuJapanTheme: Theme = {
  bg: 'min-h-screen bg-[#fafafa] flex items-center justify-center px-4 relative overflow-hidden',
  card: 'bg-white border border-gray-200 p-10 md:p-12 relative overflow-hidden shadow-sm',
  topBar: 'absolute top-0 left-0 w-full h-[3px] bg-[#bc002d]',
  logo: (
    <div className="text-center mb-10">
      <h1 className="text-4xl font-serif font-black tracking-tighter text-black">
        <span className="text-[#bc002d]">JEJU</span> JAPAN
      </h1>
      <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 uppercase">News Network · Admin</span>
    </div>
  ),
  accent: '#bc002d',
  accentCls: 'bg-[#bc002d]',
  accentHover: 'hover:bg-[#a0001f]',
  inputFocus: 'focus:border-[#bc002d]',
  inputBorder: 'border-gray-200 hover:border-gray-300',
  labelCls: 'text-[10px] font-bold text-gray-700 uppercase tracking-widest',
  btnCls: 'w-full bg-[#bc002d] text-white py-3.5 font-black text-xs uppercase tracking-widest hover:bg-[#a0001f] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group',
  errorCls: 'text-xs text-red-600 bg-red-50 p-3 border border-red-200 font-bold flex items-center gap-2',
  backCls: 'fixed top-8 left-8 flex items-center gap-2 text-gray-700 hover:text-[#bc002d] transition-all group z-10',
  tagline: 'Secure Access',
  footerText: '© Jeju Japan News Network',
  siteName: 'Jeju Japan',
  fontStyle: "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Playfair+Display:wght@900&display=swap');",
};

/* ── JejuQQ ── */
const jejuQQTheme: Theme = {
  bg: 'min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden',
  card: 'bg-white border-t-4 border-[#e60012] shadow-lg p-10 md:p-12 relative overflow-hidden',
  topBar: '',
  logo: (
    <div className="text-center mb-10">
      <div className="flex flex-col leading-none items-center">
        <span className="text-[42px] font-serif font-black tracking-tighter text-black">Jeju</span>
        <span className="text-[32px] font-serif font-black tracking-tighter text-black -mt-3">QQ Daily</span>
      </div>
      <p className="text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase mt-2">Admin Portal</p>
    </div>
  ),
  accent: '#e60012',
  accentCls: 'bg-[#e60012]',
  accentHover: 'hover:bg-[#cc0010]',
  inputFocus: 'focus:border-[#e60012]',
  inputBorder: 'border-gray-200 hover:border-gray-300',
  labelCls: 'text-[11px] font-bold text-black uppercase tracking-widest',
  btnCls: 'w-full bg-black text-white py-3.5 font-black text-xs uppercase tracking-widest hover:bg-[#e60012] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group',
  errorCls: 'text-xs text-red-600 bg-red-50 p-3 border border-red-200 font-bold flex items-center gap-2',
  backCls: 'fixed top-8 left-8 flex items-center gap-2 text-gray-800 hover:text-[#e60012] transition-all group z-10',
  tagline: 'Welcome Back',
  footerText: '© Jeju QQ Daily',
  siteName: 'Jeju QQ',
};

/* ── JejuTime ── */
const jejuTimeTheme: Theme = {
  bg: 'min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 relative overflow-hidden',
  card: 'bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-10 md:p-12 relative overflow-hidden border border-slate-100',
  topBar: 'absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-3xl',
  logo: (
    <div className="text-center mb-10">
      <h1 className="text-4xl font-black tracking-tighter text-blue-950">
        Jeju <span className="text-blue-500">Times</span>
      </h1>
      <p className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase mt-1">Admin Portal</p>
    </div>
  ),
  accent: 'blue-600',
  accentCls: 'bg-blue-600',
  accentHover: 'hover:bg-blue-700',
  inputFocus: 'focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
  inputBorder: 'border-slate-200 hover:border-slate-300',
  labelCls: 'text-xs font-bold text-slate-600 uppercase tracking-widest',
  btnCls: 'w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-blue-700 disabled:opacity-60 transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 group',
  errorCls: 'text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 font-bold flex items-center gap-2',
  backCls: 'fixed top-8 left-8 flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-all group z-10',
  tagline: 'Welcome Back',
  footerText: '© Jeju Times · Coastal Edition',
  siteName: 'Jeju Times',
};

/* ─── Shared form logic ─── */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update browser title based on domain theme
  useEffect(() => {
    if (theme.siteName) {
      document.title = `Admin Login | ${theme.siteName}`;
    }
  }, [theme.siteName]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

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
      const verifyResponse = await fetch('/api/admin/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!verifyResponse.ok) {
        if (verifyResponse.status === 403) { router.replace('/'); return; }
        setFieldErrors({ general: 'Verification service unavailable. Please try again.' });
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
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

      const roleCheck = await fetch('/api/admin/auth/session', { method: 'POST' });
      if (!roleCheck.ok) {
        await supabase.auth.signOut();
        if (roleCheck.status === 403) { router.replace('/'); return; }
        setFieldErrors({ general: 'Access denied. Your account is not an admin.' });
        return;
      }

      const redirectTo = searchParams.get('redirectTo');
      const safePath = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo : '/admin/dashboard';
      router.push(safePath);
    } catch (err) {
      console.error('Login error:', err);
      setFieldErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase = `w-full pl-11 pr-4 py-4 bg-gray-50 border-2 rounded-2xl outline-none text-gray-900 font-bold transition-all duration-300 ${theme.inputFocus}`;

  return (
    <div className={theme.bg}>
      {/* Soft bg blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-current opacity-5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-current opacity-5 rounded-full blur-[120px]" />

      {/* Back link */}
      <Link href="/" className={theme.backCls}>
        <div className="p-2 bg-white rounded-full shadow-sm border border-gray-200 group-hover:shadow-md transition-all">
          <Home className="w-4 h-4" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest">Back</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10"
      >
        {theme.logo}

        <div className={theme.card}>
          {theme.topBar && <div className={theme.topBar} />}

          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">{theme.tagline}</h2>
            <p className="text-sm text-gray-500">Secure access for administrators.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className={`block ml-1 ${theme.labelCls}`}>Admin Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-current transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email" type="email" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className={`${inputBase} ${fieldErrors.email ? 'border-red-400' : theme.inputBorder}`}
                  placeholder="admin@example.com"
                />
                <AnimatePresence>
                  {fieldErrors.email && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1.5 ml-1 text-xs text-red-600 font-bold">
                      <AlertCircle className="w-3 h-3" />{fieldErrors.email}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className={`block ml-1 ${theme.labelCls}`}>Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-current transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={`${inputBase} pr-12 ${fieldErrors.password ? 'border-red-400' : theme.inputBorder}`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <AnimatePresence>
                  {fieldErrors.password && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1.5 ml-1 text-xs text-red-600 font-bold">
                      <AlertCircle className="w-3 h-3" />{fieldErrors.password}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* General error */}
            <AnimatePresence>
              {fieldErrors.general && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className={theme.errorCls}>
                  <AlertCircle className="w-4 h-4 shrink-0" />{fieldErrors.general}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button type="submit" disabled={isSubmitting} className={`${theme.btnCls} disabled:cursor-not-allowed`}>
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {isSubmitting
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Authorize Access</span><ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              }
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-gray-400 font-bold text-[10px] uppercase tracking-[0.25em]">
          {theme.footerText}
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400 font-black tracking-widest uppercase text-xs">
          Initializing Secure Portal...
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
