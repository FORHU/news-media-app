"use client";

import React, { useState, useEffect, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

function getTheme(domain: string): Theme {
  if (domain.includes('lavaguetech')) return lavagueTechTheme;
  if (domain.includes('jejujapan')) return jejuJapanTheme;
  if (domain.includes('jejuqq'))   return jejuQQTheme;
  if (domain.includes('jejutime')) return jejuTimeTheme;
  if (domain.includes('voicejeju')) return voiceJejuTheme;
  if (domain.includes('skyblueprime')) return skyBluePrimeTheme;
  if (domain.includes('legalhyper')) return legalHyperTheme;
  if (domain.includes('linktechnews')) return linkTechNewsTheme;
  if (domain.includes('dbtechnews')) return dbTechNewsTheme;
  if (domain.includes('magazinetechy')) return magazineTechyTheme;
  if (domain.includes('magazineair')) return magazineAirTheme;
  if (domain.includes('techygate')) return techyGateTheme;
  if (domain.includes('newyorksignal')) return newYorkSignalTheme;
  if (domain.includes('technikpost')) return technikPostTheme;
  if (domain.includes('techoggi')) return techOggiTheme;
  if (domain.includes('techhoy')) return techHoyTheme;
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

/* ── LegalHyper ── */
const legalHyperTheme: Theme = {
  bg: 'min-h-screen bg-[#F4F0E6] flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-[#FBF9F3] border border-[#DCD5C2] border-t-4 border-t-[#0E1A2F] shadow-xl p-8 md:p-12 relative overflow-hidden rounded-none',
  topBar: 'absolute top-0 left-0 w-full h-[3px] bg-[#B08D3F]',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <div className="flex items-end gap-[3px] mb-3" aria-hidden>
        <span className="w-[3px] h-4 bg-[#B08D3F]" />
        <span className="w-[3px] h-6 bg-[#0E1A2F]" />
        <span className="w-[3px] h-4 bg-[#B08D3F]" />
      </div>
      <h1 className="font-bodoni text-4xl font-medium uppercase tracking-[0.06em] text-[#0E1A2F] leading-none">LegalHyper</h1>
      <p className="text-[10px] font-garamond uppercase tracking-[0.34em] text-[#7A7466] mt-3">Editorial Administration</p>
    </div>
  ),
  accent: '#0E1A2F',
  accentCls: 'bg-[#0E1A2F]',
  accentHover: 'hover:bg-[#16233d]',
  inputFocus: 'focus:border-[#0E1A2F]',
  inputBorder: 'border-[#DCD5C2] hover:border-[#c9c0a8]',
  inputBgCls: 'bg-white',
  inputRounded: 'rounded-none',
  labelCls: 'text-[10px] font-bold text-[#0E1A2F] uppercase tracking-[0.28em]',
  btnCls: 'w-full bg-[#0E1A2F] text-[#F4F0E6] py-4 font-bold text-[11px] uppercase tracking-[0.28em] hover:bg-[#16233d] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group relative overflow-hidden rounded-none',
  errorCls: 'text-xs text-[#7A1F2B] bg-[#7A1F2B]/5 p-3 border border-[#7A1F2B]/20 font-bold flex items-center gap-2',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-[#7A7466] hover:text-[#0E1A2F] transition-all group z-10 font-bold uppercase tracking-[0.24em] text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-bodoni font-medium text-[#0E1A2F] tracking-tight mb-1',
  subtextCls: 'text-sm text-[#7A7466]',
  footerCls: 'text-center mt-8 text-[#7A7466] font-bold text-[10px] uppercase tracking-[0.28em]',
  tagline: 'Editorial Sign-In',
  footerText: '© LegalHyper · International Edition',
  siteName: 'LegalHyper',
};

/* ── LinkTechnews ── */
const linkTechNewsTheme: Theme = {
  bg: 'min-h-screen bg-[#FBFBFD] flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-white border border-[#E3E3EA] shadow-lg p-8 md:p-12 relative overflow-hidden rounded-[2px]',
  topBar: 'absolute top-0 left-0 w-full h-1 bg-[#3B39E4]',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <div className="flex items-center font-serif text-3xl font-black tracking-tight text-[#14161F]">
        <span className="text-[#3B39E4] mr-1">▸</span>LINK<span className="text-[#3B39E4]">TECH</span>NEWS
      </div>
      <p className="text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-[#6B6F80] mt-3">▸ Admin Console</p>
    </div>
  ),
  accent: '#3B39E4',
  accentCls: 'bg-[#3B39E4]',
  accentHover: 'hover:bg-[#2f2dc9]',
  inputFocus: 'focus:border-[#3B39E4]',
  inputBorder: 'border-[#E3E3EA] hover:border-[#d3d3dd]',
  inputBgCls: 'bg-[#FBFBFD]',
  inputRounded: 'rounded-[2px]',
  labelCls: 'text-[10px] font-mono font-bold text-[#14161F] uppercase tracking-[0.22em]',
  btnCls: 'w-full bg-[#3B39E4] text-white py-4 font-bold text-[11px] uppercase tracking-[0.22em] hover:bg-[#2f2dc9] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group relative overflow-hidden rounded-[2px]',
  errorCls: 'text-xs text-red-600 bg-red-50 p-3 border border-red-200 font-bold flex items-center gap-2 rounded-[2px]',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-[#6B6F80] hover:text-[#3B39E4] transition-all group z-10 font-mono font-bold uppercase tracking-[0.2em] text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-serif font-black text-[#14161F] tracking-tight mb-1',
  subtextCls: 'text-sm text-[#6B6F80]',
  footerCls: 'text-center mt-8 text-[#6B6F80] font-mono font-bold text-[10px] uppercase tracking-[0.22em]',
  tagline: 'Sign in to the Desk',
  footerText: '© LinkTechnews — the technology wire',
  siteName: 'LinkTechnews',
};

/* ── DbTechnews ── */
const dbTechNewsTheme: Theme = {
  bg: 'min-h-screen bg-[#E9EEF3] flex items-center justify-center px-4 py-12 relative overflow-y-auto font-mono',
  card: 'bg-white border border-[#C6D1DD] shadow-lg p-8 md:p-12 relative overflow-hidden rounded-md',
  topBar: 'absolute top-0 left-0 w-full h-1 bg-[#2F6FEB]',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <div className="flex items-baseline font-mono text-2xl font-bold tracking-tight text-[#0C1A2B]">
        <span className="text-[#2F6FEB] mr-1">$</span>db.technews
        <span className="ml-0.5 inline-block w-[0.5ch] h-[1em] bg-[#2F6FEB] animate-tn-caret" />
      </div>
      <p className="text-[10px] font-mono font-bold lowercase tracking-[0.12em] text-[#566575] mt-3">» admin — auth required</p>
    </div>
  ),
  accent: '#2F6FEB',
  accentCls: 'bg-[#2F6FEB]',
  accentHover: 'hover:bg-[#245bd0]',
  inputFocus: 'focus:border-[#2F6FEB]',
  inputBorder: 'border-[#C6D1DD] hover:border-[#b2c0cf]',
  inputBgCls: 'bg-[#F5F8FB]',
  inputRounded: 'rounded-md',
  labelCls: 'text-[10px] font-mono font-bold text-[#0C1A2B] lowercase tracking-[0.1em]',
  btnCls: 'w-full bg-[#0C1A2B] text-white py-4 font-mono font-bold text-[11px] lowercase tracking-[0.12em] hover:bg-[#2F6FEB] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group relative overflow-hidden rounded-md',
  errorCls: 'text-xs font-mono text-red-600 bg-red-50 p-3 border border-red-200 font-bold flex items-center gap-2 rounded-md',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-[#566575] hover:text-[#2F6FEB] transition-all group z-10 font-mono font-bold lowercase tracking-[0.1em] text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-mono font-bold text-[#0C1A2B] tracking-tight mb-1',
  subtextCls: 'text-sm text-[#566575] font-mono',
  footerCls: 'text-center mt-8 text-[#566575] font-mono font-bold text-[10px] lowercase tracking-[0.1em]',
  tagline: '$ session --login',
  footerText: '// dbtechnews — infrastructure & data',
  siteName: 'DbTechnews',
};

/* ── Magazine Techy ── */
const magazineTechyTheme: Theme = {
  bg: 'min-h-screen bg-[#FBF6EF] flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-white border border-[#EBE2D4] shadow-[0_20px_60px_-20px_rgba(28,21,18,0.2)] p-8 md:p-12 relative overflow-hidden rounded-none',
  topBar: 'absolute top-0 left-0 w-full h-1 bg-[#D81E5B]',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <h1 className="font-serif text-4xl font-semibold tracking-[0.02em] text-[#1C1512]">Magazine<span className="italic text-[#D81E5B]"> Techy</span></h1>
      <span className="h-px w-10 bg-[#D81E5B] mt-3" />
      <p className="text-[11px] font-serif italic text-[#6E6257] mt-2">The Masthead · Administration</p>
    </div>
  ),
  accent: '#D81E5B',
  accentCls: 'bg-[#D81E5B]',
  accentHover: 'hover:bg-[#c2154d]',
  inputFocus: 'focus:border-[#D81E5B]',
  inputBorder: 'border-[#EBE2D4] hover:border-[#ddd0bb]',
  inputBgCls: 'bg-[#FBF6EF]',
  inputRounded: 'rounded-none',
  labelCls: 'text-[11px] font-serif italic text-[#1C1512] tracking-wide',
  btnCls: 'w-full bg-[#1C1512] text-white py-4 font-serif text-sm tracking-[0.16em] uppercase hover:bg-[#D81E5B] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group relative overflow-hidden rounded-none',
  errorCls: 'text-xs text-red-700 bg-red-50 p-3 border border-red-200 font-bold flex items-center gap-2',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-[#6E6257] hover:text-[#D81E5B] transition-all group z-10 font-serif italic tracking-wide text-[11px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-serif font-semibold text-[#1C1512] tracking-tight mb-1',
  subtextCls: 'text-sm text-[#6E6257]',
  footerCls: 'text-center mt-8 text-[#6E6257] font-serif italic text-[11px] tracking-wide',
  tagline: 'Welcome back',
  footerText: '© Magazine Techy — long looks at technology',
  siteName: 'Magazine Techy',
};

/* ── Magazine Air ── */
const magazineAirTheme: Theme = {
  bg: 'min-h-screen bg-[#F3F8FA] flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-white border border-[#E2ECEF] shadow-[0_24px_70px_-30px_rgba(51,67,77,0.25)] p-8 md:p-14 relative overflow-hidden rounded-none',
  topBar: '',
  logo: (
    <div className="text-center mb-12 flex flex-col items-center">
      <div className="flex items-center gap-3 font-serif font-light uppercase tracking-[0.42em] text-2xl text-[#33434D]">
        MAGAZINE<span className="h-[1.1em] w-px bg-[#227D96]" /><span className="text-[#227D96]">AIR</span>
      </div>
      <p className="text-[10px] uppercase tracking-[0.34em] text-[#7B8990] mt-4">Administration</p>
    </div>
  ),
  accent: '#227D96',
  accentCls: 'bg-[#227D96]',
  accentHover: 'hover:bg-[#1c6a80]',
  inputFocus: 'focus:border-[#227D96]',
  inputBorder: 'border-[#E2ECEF] hover:border-[#d0dfe3]',
  inputBgCls: 'bg-white',
  inputRounded: 'rounded-none',
  labelCls: 'text-[10px] font-medium text-[#33434D] uppercase tracking-[0.32em]',
  btnCls: 'w-full bg-[#227D96] text-white py-4 font-medium text-[11px] uppercase tracking-[0.32em] hover:bg-[#1c6a80] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group relative overflow-hidden rounded-none',
  errorCls: 'text-xs text-red-700 bg-red-50 p-3 border border-red-200 font-medium flex items-center gap-2',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-[#7B8990] hover:text-[#227D96] transition-all group z-10 font-medium uppercase tracking-[0.28em] text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-serif font-light text-[#33434D] tracking-tight mb-1',
  subtextCls: 'text-sm text-[#7B8990]',
  footerCls: 'text-center mt-8 text-[#7B8990] font-medium text-[10px] uppercase tracking-[0.3em]',
  tagline: 'Sign in',
  footerText: '© Magazine Air',
  siteName: 'Magazine Air',
};

/* ── TechyGate ── */
const techyGateTheme: Theme = {
  bg: 'min-h-screen bg-white flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-white border-2 border-[#0F0F0F] shadow-[8px_8px_0_0_#0F0F0F] p-8 md:p-12 relative overflow-hidden rounded-none',
  topBar: 'absolute top-0 left-0 w-full h-2 bg-[#F1530A]',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <div className="flex items-stretch font-serif text-3xl font-bold uppercase tracking-tight text-[#0F0F0F]">
        <span className="mr-1.5 w-[3px] bg-[#F1530A]" />TECHY<span className="text-[#F1530A]">GATE</span><span className="ml-1.5 w-[3px] bg-[#F1530A]" />
      </div>
      <p className="text-[10px] font-serif font-bold uppercase tracking-[0.18em] text-white bg-[#0F0F0F] px-2.5 py-1 mt-3">Control Room</p>
    </div>
  ),
  accent: '#F1530A',
  accentCls: 'bg-[#F1530A]',
  accentHover: 'hover:bg-[#d84809]',
  inputFocus: 'focus:border-[#F1530A]',
  inputBorder: 'border-[#0F0F0F] hover:border-[#0F0F0F]',
  inputBgCls: 'bg-white',
  inputRounded: 'rounded-none',
  labelCls: 'text-[11px] font-serif font-bold text-[#0F0F0F] uppercase tracking-[0.14em]',
  btnCls: 'w-full bg-[#0F0F0F] text-white py-4 font-serif font-bold text-sm uppercase tracking-[0.2em] hover:bg-[#F1530A] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group relative overflow-hidden rounded-none',
  errorCls: 'text-xs text-red-700 bg-red-50 p-3 border-2 border-red-300 font-bold flex items-center gap-2',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-[#5E5E5E] hover:text-[#F1530A] transition-all group z-10 font-serif font-bold uppercase tracking-[0.16em] text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-serif font-bold text-[#0F0F0F] uppercase tracking-tight mb-1',
  subtextCls: 'text-sm text-[#5E5E5E]',
  footerCls: 'text-center mt-8 text-[#5E5E5E] font-serif font-bold text-[10px] uppercase tracking-[0.18em]',
  tagline: 'Operator Sign-In',
  footerText: '© TechyGate — your gateway to tech',
  siteName: 'TechyGate',
};

/* ── New York Signal ── */
const newYorkSignalTheme: Theme = {
  bg: 'min-h-screen bg-[#F4F0E6] flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-[#FBF9F3] border border-[#E0D7C5] border-t-[3px] border-t-[#1A1613] shadow-lg p-8 md:p-12 relative overflow-hidden rounded-none',
  topBar: '',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <div className="flex items-center gap-2 font-serif text-3xl font-black tracking-tight text-[#1A1613]">
        <span aria-hidden className="flex items-end gap-[2px] pb-[0.18em]">
          <span className="w-[3px] h-[0.35em] bg-[#7C231E]" />
          <span className="w-[3px] h-[0.55em] bg-[#7C231E]" />
          <span className="w-[3px] h-[0.8em] bg-[#7C231E]" />
        </span>
        The New York Signal
      </div>
      <p className="text-[10px] font-mono font-bold uppercase tracking-[0.24em] text-[#6A6153] mt-3">Newsroom Administration</p>
    </div>
  ),
  accent: '#7C231E',
  accentCls: 'bg-[#7C231E]',
  accentHover: 'hover:bg-[#661c18]',
  inputFocus: 'focus:border-[#7C231E]',
  inputBorder: 'border-[#E0D7C5] hover:border-[#d2c6ab]',
  inputBgCls: 'bg-white',
  inputRounded: 'rounded-none',
  labelCls: 'text-[10px] font-mono font-bold text-[#1A1613] uppercase tracking-[0.22em]',
  btnCls: 'w-full bg-[#1A1613] text-[#F4F0E6] py-4 font-serif font-bold text-sm uppercase tracking-[0.2em] hover:bg-[#7C231E] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group relative overflow-hidden rounded-none',
  errorCls: 'text-xs text-[#7C231E] bg-[#7C231E]/5 p-3 border border-[#7C231E]/20 font-bold flex items-center gap-2',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-[#6A6153] hover:text-[#7C231E] transition-all group z-10 font-mono font-bold uppercase tracking-[0.2em] text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-serif font-black text-[#1A1613] tracking-tight mb-1',
  subtextCls: 'text-sm text-[#6A6153]',
  footerCls: 'text-center mt-8 text-[#6A6153] font-mono font-bold text-[10px] uppercase tracking-[0.22em]',
  tagline: 'Subscriber Desk Sign-In',
  footerText: '© The New York Signal',
  siteName: 'New York Signal',
};

/* ── TechnikPost ── */
const technikPostTheme: Theme = {
  bg: 'min-h-screen bg-[#F3F2F2] flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-[#FAF9F7] border border-[#DCD8D2] shadow-lg p-8 md:p-12 relative overflow-hidden rounded',
  topBar: 'absolute top-0 left-0 w-full h-[3px] bg-[#B68235]',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <div className="inline-block pb-1.5 border-b border-[#B68235] font-serif text-3xl uppercase tracking-[0.06em] text-[#201F1D]">
        TECHNIK<span className="italic lowercase">Post</span>
      </div>
      <p className="text-[10px] font-serif uppercase tracking-[0.28em] text-[#8A6226] mt-3">Redaktions-Administration</p>
    </div>
  ),
  accent: '#B68235',
  accentCls: 'bg-[#B68235]',
  accentHover: 'hover:bg-[#96692a]',
  inputFocus: 'focus:border-[#B68235]',
  inputBorder: 'border-[#DCD8D2] hover:border-[#c9c2b6]',
  inputBgCls: 'bg-white',
  inputRounded: 'rounded',
  labelCls: 'text-[10px] font-bold text-[#201F1D] uppercase tracking-[0.24em]',
  btnCls: 'w-full bg-[#201F1D] text-[#FAF9F7] py-4 font-serif font-semibold text-sm uppercase tracking-[0.2em] hover:bg-[#B68235] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group relative overflow-hidden rounded',
  errorCls: 'text-xs text-[#8A6226] bg-[#B68235]/5 p-3 border border-[#B68235]/20 font-bold flex items-center gap-2 rounded',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-[#6E6862] hover:text-[#B68235] transition-all group z-10 font-serif font-semibold uppercase tracking-[0.2em] text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-serif font-semibold text-[#201F1D] tracking-tight mb-1',
  subtextCls: 'text-sm text-[#6E6862]',
  footerCls: 'text-center mt-8 text-[#6E6862] font-serif font-semibold text-[10px] uppercase tracking-[0.24em]',
  tagline: 'Redaktionelle Anmeldung',
  footerText: '© TechnikPost',
  siteName: 'TechnikPost',
};

/* ── TechOggi ── */
const techOggiTheme: Theme = {
  bg: 'min-h-screen bg-[#F6FBF8] flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-white border border-[#DCEAE1] shadow-xl p-8 md:p-12 relative overflow-hidden rounded-2xl',
  topBar: 'absolute top-0 left-0 w-full h-1.5 bg-[#0EA968]',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <div className="font-sans text-3xl font-black tracking-tight text-[#12241C]">
        Tech<span className="text-[#0EA968] underline decoration-2 underline-offset-4">Oggi</span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5B6E63] mt-3">Portale Amministrativo</p>
    </div>
  ),
  accent: '#0EA968',
  accentCls: 'bg-[#0EA968]',
  accentHover: 'hover:bg-[#0C8C55]',
  inputFocus: 'focus:border-[#0EA968]',
  inputBorder: 'border-[#DCEAE1] hover:border-[#c3ddd0]',
  inputBgCls: 'bg-[#F6FBF8]',
  inputRounded: 'rounded-xl',
  labelCls: 'text-[10px] font-bold text-[#12241C] uppercase tracking-[0.25em]',
  btnCls: 'w-full bg-[#0EA968] text-white py-4 rounded-xl font-bold text-[11px] uppercase tracking-[0.25em] hover:bg-[#0C8C55] disabled:opacity-60 transition-all shadow-lg shadow-[#0EA968]/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 group relative overflow-hidden',
  errorCls: 'text-xs text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 font-bold flex items-center gap-3',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-[#5B6E63] hover:text-[#0EA968] transition-all group z-10 font-bold uppercase tracking-[0.25em] text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-black text-[#12241C] tracking-tight mb-1',
  subtextCls: 'text-sm text-[#5B6E63]',
  footerCls: 'text-center mt-8 text-[#5B6E63] font-bold text-[10px] uppercase tracking-[0.25em]',
  tagline: 'Bentornato',
  footerText: '© Tech Oggi — la tecnologia, oggi',
  siteName: 'Tech Oggi',
/* ── TechHoy ── */
const techHoyTheme: Theme = {
  bg: 'min-h-screen bg-[#F6F3EC] flex items-center justify-center px-4 py-12 relative overflow-y-auto',
  card: 'bg-white border border-[#DED6C6] shadow-lg p-8 md:p-12 relative overflow-hidden rounded-none',
  topBar: 'absolute top-0 left-0 w-full h-[4px] bg-[#B3261E]',
  logo: (
    <div className="text-center mb-10 flex flex-col items-center">
      <div className="inline-flex items-baseline font-serif text-3xl font-black tracking-tight text-[#14120E]">
        <span className="text-[#B3261E]">¡</span>TECH
        <span className="bg-[#B3261E] text-white px-1.5 ml-[2px]">HOY</span>
      </div>
      <p className="text-[10px] font-mono font-bold uppercase tracking-[0.24em] text-[#6A6252] mt-3">Panel de Redacción</p>
    </div>
  ),
  accent: '#B3261E',
  accentCls: 'bg-[#B3261E]',
  accentHover: 'hover:bg-[#8f1e18]',
  inputFocus: 'focus:border-[#B3261E]',
  inputBorder: 'border-[#DED6C6] hover:border-[#c9bfa8]',
  inputBgCls: 'bg-white',
  inputRounded: 'rounded-none',
  labelCls: 'text-[10px] font-mono font-bold text-[#14120E] uppercase tracking-[0.22em]',
  btnCls: 'w-full bg-[#14120E] text-[#F6F3EC] py-4 font-mono font-bold text-sm uppercase tracking-[0.2em] hover:bg-[#B3261E] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 group relative overflow-hidden rounded-none',
  errorCls: 'text-xs text-[#B3261E] bg-[#B3261E]/5 p-3 border border-[#B3261E]/20 font-bold flex items-center gap-2',
  backCls: 'fixed top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 text-[#6A6252] hover:text-[#B3261E] transition-all group z-10 font-mono font-bold uppercase tracking-[0.2em] text-[10px]',
  backIconCls: 'transition-transform group-hover:-translate-x-1',
  headingCls: 'text-2xl font-serif font-black text-[#14120E] tracking-tight mb-1',
  subtextCls: 'text-sm text-[#6A6252]',
  footerCls: 'text-center mt-8 text-[#6A6252] font-mono font-bold text-[10px] uppercase tracking-[0.22em]',
  tagline: 'Acceso a Redacción',
  footerText: '© TechHoy',
  siteName: 'TechHoy',
};

/* ─── Shared form logic ─── */
function LoginContent({ domain }: { domain: string }) {
  const searchParams = useSearchParams();
  const theme = getTheme(domain);

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

      const iconPath = getSiteIconFromDomain(domain);

      favicon.href = iconPath;
      if (!document.querySelector('link[rel="icon"]')) {
        document.head.appendChild(favicon);
      }
    }
  }, [theme.siteName, domain]);

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
      const defaultPath = loginData.role === 'moderator' ? '/admin/moderator' : '/admin/dashboard';
      const safePath = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo : defaultPath;
      // Use a hard redirect so middleware receives freshly committed httpOnly cookies.
      window.location.assign(safePath);
    } catch {
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

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
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

export default function LoginClient({ domain }: { domain: string }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400 font-black tracking-widest uppercase text-xs">
          Initializing Secure Portal...
        </div>
      </div>
    }>
      <LoginContent domain={domain} />
    </Suspense>
  );
}
