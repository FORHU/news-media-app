"use client";

import React, { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { adminLoginSchema } from '@/lib/validation/login';
import { motion, AnimatePresence } from 'framer-motion';
import { getSiteIconFromDomain } from '@/lib/tenant-utils';

/* ─── Domain theme config ─── */
type Theme = {
  bg: string;
  card: string;
  topBar: string;
  logo: React.ReactNode;
  accent: string;
  accentCls: string;
  accentHover: string;
  inputFocus: string;
  inputBorder: string;
  inputBgCls: string;
  inputRounded: string;
  labelCls: string;
  btnCls: string;
  errorCls: string;
  backCls: string;
  backIconCls: string;
  headingCls: string;
  subtextCls: string;
  footerCls: string;
  tagline: string;
  footerText: string;
  siteName: string;
  fontStyle?: string;
};

function useTheme(): Theme {
  const [domain, setDomain] = useState('');
  useEffect(() => { setDomain(window.location.hostname); }, []);

  if (domain.includes('lavaguetech')) return lavagueTechTheme;
  if (domain.includes('jejujapan')) return jejuJapanTheme;
  if (domain.includes('jejuqq'))   return jejuQQTheme;
  if (domain.includes('jejutime')) return jejuTimeTheme;
  if (domain.includes('voicejeju')) return voiceJejuTheme;
  if (domain.includes('skyblueprime')) return skyBluePrimeTheme;
  return newsIconsTheme;
}

/* ── LavagueTech ── */
const lavagueTechTheme: Theme = {
  bg: 'min-h-screen bg-white flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-white border border-gray-200 shadow-lg p-8 md:p-12 relative overflow-hidden',
  topBar: 'absolute top-0 left-0 w-full h-1 bg-teal-700',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <Image
        src="/Logo/LAVAGUETECH.png"
        alt="LavagueTech"
        width={240}
        height={60}
        className="object-contain mb-3"
        priority
      />
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-gray-200" />
        <p className="text-[10px] font-black tracking-[0.35em] text-gray-500 uppercase">Admin Portal</p>
        <span className="h-px w-8 bg-gray-200" />
      </div>
    </div>
  ),
  accent: '#0f766e',
  accentCls: 'bg-teal-700',
  accentHover: 'hover:bg-teal-800',
  inputFocus: 'focus:border-teal-600',
  inputBorder: 'border-gray-200 hover:border-gray-300',
  inputBgCls: 'bg-gray-50',
  inputRounded: 'rounded-none',
  labelCls: 'text-[10px] font-black text-gray-800 uppercase tracking-[0.25em]',
  btnCls: 'w-full bg-red-600 text-white py-4 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 group rounded-none',
  errorCls: 'text-xs text-red-600 bg-red-50 p-4 border border-red-100 font-bold flex items-center gap-3',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-gray-500 hover:text-teal-700 transition-all group z-10 font-black uppercase tracking-[0.25em] text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-black text-gray-900 tracking-tight mb-1',
  subtextCls: 'text-sm text-gray-500',
  footerCls: 'text-center mt-8 text-gray-500 font-bold text-[10px] uppercase tracking-[0.3em]',
  tagline: 'Welcome Back',
  footerText: '© LavagueTech · Technology News',
  siteName: 'LavagueTech',
};

/* ── VoiceJeju ── */
const voiceJejuTheme: Theme = {
  bg: 'min-h-screen bg-gray-50 flex items-center justify-center px-4 py-6 relative overflow-hidden font-inter',
  card: 'bg-white border border-gray-100 p-6 md:p-14 relative overflow-hidden shadow-2xl rounded-none',
  topBar: 'absolute top-0 left-0 w-full h-1.5 bg-black',
  logo: (
    <div className="text-center mb-6 sm:mb-12 flex flex-col items-center">
      <h1 className="text-4xl sm:text-6xl font-normal text-black font-voltaire tracking-tighter uppercase leading-none">VoiceJeju</h1>
      <div className="h-0.5 w-12 bg-[#e60000] mt-2 mb-1 sm:mt-4 sm:mb-2" />
      <p className="text-gray-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.4em]">Editorial Management</p>
    </div>
  ),
  accent: '#000000',
  accentCls: 'bg-black',
  accentHover: 'hover:bg-gray-800',
  inputFocus: 'focus:border-black',
  inputBorder: 'border-gray-200 hover:border-gray-300',
  inputBgCls: 'bg-white',
  inputRounded: 'rounded-none',
  labelCls: 'text-[10px] font-black text-gray-900 uppercase tracking-[0.25em]',
  btnCls: 'w-full bg-black text-white py-3 sm:py-4 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-gray-900 disabled:opacity-50 transition-all flex items-center justify-center gap-3 group rounded-none',
  errorCls: 'text-xs text-red-600 bg-red-50 p-4 border border-red-100 font-bold flex items-center gap-3',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-gray-400 hover:text-black transition-all group z-10 font-black uppercase tracking-[0.3em] text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-voltaire font-normal text-black tracking-tight mb-2 uppercase',
  subtextCls: 'text-sm text-gray-500 font-medium',
  footerCls: 'text-center mt-6 sm:mt-10 text-gray-400 font-bold text-[9px] uppercase tracking-[0.4em]',
  tagline: 'Staff Authentication',
  footerText: '© 2026 VoiceJeju News Network',
  siteName: 'VoiceJeju',
};

/* ── NewsIcons ── */
const newsIconsTheme: Theme = {
  bg: 'min-h-screen bg-white flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-white border-2 border-gray-50 rounded-[2.5rem] shadow-2xl shadow-orange-100/30 p-8 md:p-12 relative overflow-hidden',
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
  inputBgCls: 'bg-gray-50',
  inputRounded: 'rounded-2xl',
  labelCls: 'text-xs font-black text-gray-900 uppercase tracking-widest',
  btnCls: 'w-full bg-[#ff4500] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#e63e00] disabled:opacity-60 transition-all shadow-xl shadow-orange-100 hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden',
  errorCls: 'text-xs text-red-600 bg-red-50 p-4 rounded-2xl border-2 border-red-100 font-black flex items-center gap-3',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-gray-800 hover:text-[#ff4500] transition-all group z-10 font-black uppercase tracking-widest text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-black text-gray-900 tracking-tight mb-1',
  subtextCls: 'text-sm text-gray-500',
  footerCls: 'text-center mt-8 text-gray-400 font-bold text-[10px] uppercase tracking-[0.25em]',
  tagline: 'Welcome Back',
  footerText: '© FORHU AI Technologies',
  siteName: 'NewsIcons',
};

/* ── JejuJapan ── */
const jejuJapanTheme: Theme = {
  bg: 'min-h-screen bg-[#f8f8f8] flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-white border-l-4 border-[#bc002d] p-8 md:p-12 relative overflow-hidden shadow-2xl rounded-sm',
  topBar: '',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <div className="relative h-20 w-full max-w-[300px] mb-2">
        <Image
          src="/Logo/JEJUJAPANLOGO.png"
          alt="JejuJapan Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 uppercase mt-1 block">News Network · Admin</span>
    </div>
  ),
  accent: '#bc002d',
  accentCls: 'bg-[#bc002d]',
  accentHover: 'hover:bg-[#a0001f]',
  inputFocus: 'focus:border-[#bc002d]',
  inputBorder: 'border-gray-200 hover:border-gray-300',
  inputBgCls: 'bg-gray-50 text-gray-900 placeholder:text-gray-400',
  inputRounded: 'rounded-none',
  labelCls: 'text-[10px] font-bold text-gray-900 uppercase tracking-widest',
  btnCls: 'w-full bg-[#bc002d] text-white py-4 font-black text-xs uppercase tracking-widest hover:bg-[#a0001f] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 group rounded-none',
  errorCls: 'text-xs text-red-600 bg-red-50 p-3 border border-red-200 font-bold flex items-center gap-2',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-gray-600 hover:text-[#bc002d] transition-all group z-10 font-bold uppercase tracking-[0.2em] text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-black text-gray-900 tracking-tight mb-1',
  subtextCls: 'text-sm text-gray-500',
  footerCls: 'text-center mt-8 text-gray-300 font-bold text-[10px] uppercase tracking-[0.25em]',
  tagline: 'Secure Access',
  footerText: '© Jeju Japan News Network',
  siteName: 'JejuJapan',
  fontStyle: "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Playfair+Display:wght@900&display=swap');",
};

/* ── JejuQQ ── */
const jejuQQTheme: Theme = {
  bg: 'min-h-screen bg-[#fdf2f2] flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-[#fee2e2] border-t-4 border-[#dc2626] shadow-lg p-8 md:p-12 relative overflow-hidden rounded-none',
  topBar: '',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <div className="relative h-32 w-full max-w-[400px] mb-2 transition-all duration-500">
        <Image
          src="/Logo/JEJUQQLOGO.png"
          alt="JejuQQ Logo"
          fill
          className="object-contain scale-110"
          priority
        />
      </div>
      <p className="text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase mt-1">Admin Portal</p>
    </div>
  ),
  accent: '#dc2626',
  accentCls: 'bg-[#dc2626]',
  accentHover: 'hover:bg-[#cc0010]',
  inputFocus: 'focus:border-[#dc2626]',
  inputBorder: 'border-[#dc2626]',
  inputBgCls: 'bg-white',
  inputRounded: 'rounded-none',
  labelCls: 'text-[11px] font-bold text-black uppercase tracking-widest',
  btnCls: 'w-full bg-black text-white py-3.5 font-black text-xs uppercase tracking-widest hover:bg-[#dc2626] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group rounded-none',
  errorCls: 'text-xs text-red-600 bg-red-50 p-3 border border-red-200 font-bold flex items-center gap-2',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-gray-800 hover:text-[#dc2626] transition-all group z-10 font-bold uppercase tracking-widest text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-black text-gray-900 tracking-tight mb-1',
  subtextCls: 'text-sm text-gray-500',
  footerCls: 'text-center mt-8 text-gray-400 font-bold text-[10px] uppercase tracking-[0.25em]',
  tagline: 'Welcome Back',
  footerText: '© Jeju QQ Daily',
  siteName: 'JejuQQ',
};

/* ── JejuTime ── */
const jejuTimeTheme: Theme = {
  bg: 'min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 md:p-12 relative overflow-hidden border border-slate-100',
  topBar: 'absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-3xl',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <div className="relative h-32 w-full max-w-[400px] sm:h-40 sm:max-w-[550px] mb-2 transition-all duration-500">
        <Image
          src="/Logo/JEJUTIMELOGO.png"
          alt="JejuTime Logo"
          fill
          className="object-contain scale-110"
          priority
        />
      </div>
      <p className="text-[10px] font-baskerville font-bold tracking-[0.25em] text-slate-400 uppercase mt-1">Admin Portal</p>
    </div>
  ),
  accent: 'blue-600',
  accentCls: 'bg-blue-600',
  accentHover: 'hover:bg-blue-700',
  inputFocus: 'focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
  inputBorder: 'border-slate-200 hover:border-slate-300',
  inputBgCls: 'bg-gray-50',
  inputRounded: 'rounded-2xl',
  labelCls: 'text-xs font-bold text-slate-600 uppercase tracking-widest',
  btnCls: 'w-full bg-blue-600 text-white py-3.5 rounded-2xl font-baskerville font-bold text-sm uppercase tracking-widest hover:bg-blue-700 disabled:opacity-60 transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 group',
  errorCls: 'text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 font-bold flex items-center gap-2',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-all group z-10 font-bold uppercase tracking-widest text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-black text-gray-900 tracking-tight mb-1',
  subtextCls: 'text-sm text-gray-500',
  footerCls: 'text-center mt-8 text-gray-400 font-bold text-[10px] uppercase tracking-[0.25em]',
  tagline: 'Welcome Back',
  footerText: '© JejuTime · Coastal Edition',
  siteName: 'JejuTime',
};

/* ── SkyBluePrime ── */
const skyBluePrimeTheme: Theme = {
  bg: 'min-h-screen bg-sky-50 flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-white border-t-8 border-sky-950 shadow-2xl p-8 md:p-12 relative overflow-hidden rounded-sm',
  topBar: '',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <div className="text-3xl font-black tracking-tighter text-white bg-sky-950 px-3 py-1 leading-none mb-2">
        SKY<span className="text-sky-400">BLUE</span>PRIME
      </div>
      <p className="text-[10px] font-bold tracking-[0.3em] text-sky-600 uppercase mt-2">Admin Portal</p>
    </div>
  ),
  accent: '#082f49', // sky-950
  accentCls: 'bg-sky-950',
  accentHover: 'hover:bg-sky-900',
  inputFocus: 'focus:border-sky-950',
  inputBorder: 'border-sky-200 hover:border-sky-300',
  inputBgCls: 'bg-white',
  inputRounded: 'rounded-none',
  labelCls: 'text-[11px] font-bold text-sky-950 uppercase tracking-widest',
  btnCls: 'w-full bg-sky-950 text-white py-4 font-black text-xs uppercase tracking-widest hover:bg-sky-900 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group rounded-none',
  errorCls: 'text-xs text-red-600 bg-red-50 p-3 border border-red-200 font-bold flex items-center gap-2',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-sky-800 hover:text-sky-950 transition-all group z-10 font-bold uppercase tracking-widest text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-black text-sky-950 tracking-tight mb-1',
  subtextCls: 'text-sm text-sky-600',
  footerCls: 'text-center mt-8 text-sky-400 font-bold text-[10px] uppercase tracking-[0.25em]',
  tagline: 'Secure Access',
  footerText: '© Sky Blue Prime News',
  siteName: 'Sky Blue Prime',
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
  
  // Update browser title and favicon based on domain theme
  useEffect(() => {
    if (theme.siteName) {
      document.title = `Admin Login | ${theme.siteName}`;
      
      // Dynamic Favicon update
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement || document.createElement('link');
      favicon.rel = 'icon';
      
      const domain = window.location.hostname.toLowerCase();
      const iconPath = getSiteIconFromDomain(domain);
      
      favicon.href = iconPath;
      if (!document.querySelector('link[rel="icon"]')) {
        document.head.appendChild(favicon);
      }
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!verifyResponse.ok) {
        if (verifyResponse.status === 403) {
          setFieldErrors({ email: 'Your account does not have access for this domain.' });
        } else {
          setFieldErrors({ general: 'Verification service unavailable. Please try again.' });
        }
        return;
      }

      const loginResponse = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({}));
        const msg = (errorData.error ?? '').toLowerCase();
        if (msg.includes('invalid login credentials')) {
          setFieldErrors({ password: 'The password you entered is incorrect.' });
        } else if (loginResponse.status === 403) {
          setFieldErrors({ general: 'Access denied. Your account is not authorized for this domain.' });
        } else {
          setFieldErrors({ general: errorData.error || 'Login failed. Please try again.' });
        }
        return;
      }

      const loginData = await loginResponse.json().catch(() => ({}));
      const redirectTo = searchParams.get('redirectTo');
      let defaultPath = loginData.role === 'moderator' ? '/admin/moderator' : '/admin/dashboard';
      const safePath = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo : defaultPath;
      // Use a hard redirect so middleware receives freshly committed httpOnly cookies.
      window.location.assign(safePath);
    } catch (err) {
      setFieldErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase = `w-full pl-11 pr-4 py-3 sm:py-4 ${theme.inputBgCls} border-2 ${theme.inputRounded} outline-none text-gray-900 font-bold transition-all duration-300 ${theme.inputFocus}`;

  return (
    <div className={`${theme.bg} site-theme-${theme.siteName.toLowerCase().replace(/\s+/g, '')}-com`}>
      {/* Soft bg blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-current opacity-5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-current opacity-5 rounded-full blur-[120px]" />

      {/* Back link */}
      <Link href="/" className={theme.backCls}>
        <ArrowLeft size={16} className={theme.backIconCls} />
        <span>Back to Site</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10 mt-0"
      >
        {theme.logo}

        <div className={theme.card}>
          {theme.topBar && <div className={theme.topBar} />}

          <div className="mb-8">
            <h2 className={theme.headingCls}>{theme.tagline}</h2>
            <p className={theme.subtextCls}>Secure access for administrators.</p>
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

        <p className={theme.footerCls}>
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
