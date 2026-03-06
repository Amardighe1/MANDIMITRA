'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Leaf,
  TrendingUp,
  Shield,
  BarChart3,
  Cloud,
  Camera,
  Stethoscope,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Sun,
  Droplets,
  Wind,
  ChevronRight,
  Bell,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { CTASection } from '@/components/sections/CTASection';
import { Footer } from '@/components/layout/Footer';
import { apiUrl } from '@/lib/api-config';

/* ── Quick-action grid items ─────────────────────────────── */
const quickActions = [
  { label: 'पीक तपासा', desc: 'फोटो काढा, रोग ओळखा', icon: Camera, color: 'from-emerald-500 to-emerald-600', href: '/crop-analysis' },
  { label: 'भाव अंदाज', desc: '15 दिवसांचा अंदाज', icon: TrendingUp, color: 'from-amber-500 to-orange-500', href: '/price-forecast' },
  { label: 'पीक जोखीम', desc: 'AI जोखीम मूल्यांकन', icon: Shield, color: 'from-blue-500 to-blue-600', href: '/crop-risk' },
  { label: 'मंडी भाव', desc: 'आजचे बाजारभाव', icon: BarChart3, color: 'from-purple-500 to-purple-600', href: '/markets' },
  { label: 'हवामान', desc: 'स्थानिक अंदाज', icon: Cloud, color: 'from-sky-500 to-cyan-500', href: '/weather' },
  { label: 'मंडी विक्री', desc: 'खरेदीदार शोधा', icon: ShoppingCart, color: 'from-rose-500 to-pink-500', href: '/mandi' },
  { label: 'डॉक्टर', desc: 'पशुवैद्यकीय सेवा', icon: Stethoscope, color: 'from-teal-500 to-teal-600', href: '/veterinary' },
  { label: 'आपत्कालीन', desc: 'SOS मदत', icon: AlertTriangle, color: 'from-red-500 to-red-600', href: '/dashboard/farmer' },
];

/* ── Tips carousel ───────────────────────────────────────── */
const dailyTips = [
  'पिकावर कीड दिसल्यास लगेच "पीक तपासा" मध्ये फोटो अपलोड करा.',
  'विक्रीपूर्वी "भाव अंदाज" तपासा — योग्य वेळी विक्री करा.',
  'पावसाळ्यात "हवामान" विभागात दररोज अंदाज पहा.',
  'नवीन खरेदीदार शोधण्यासाठी "मंडी विक्री" वापरा.',
];

/* ── Farmer Dashboard Component ──────────────────────────── */
function FarmerHome({ user }: { user: { full_name: string; role: string } }) {
  const [weather, setWeather] = useState<any>(null);
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tips
  useEffect(() => {
    const t = setInterval(() => setTipIndex((i) => (i + 1) % dailyTips.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Fetch weather summary (lightweight)
  useEffect(() => {
    fetch(apiUrl('/api/market/summary'))
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setWeather(d))
      .catch(() => {});
  }, []);

  const firstName = user.full_name?.split(' ')[0] || 'शेतकरी';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'सुप्रभात' : hour < 17 ? 'नमस्कार' : 'शुभ संध्याकाळ';

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ── Header ────────────────────────────────── */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 text-white">
        <div className="px-4 pt-4 pb-6" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">मंडीमित्र</span>
            </div>
            <Link href="/dashboard/farmer" className="relative p-2 bg-white/15 rounded-xl backdrop-blur-sm">
              <Bell className="w-5 h-5" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />
            </Link>
          </div>

          {/* Greeting */}
          <div className="mb-1">
            <h1 className="text-2xl font-bold">{greeting}, {firstName}! 👋</h1>
            <p className="text-emerald-100 text-sm mt-0.5">तुमच्या शेतीसाठी आज काय करायचे?</p>
          </div>
        </div>

        {/* ── Tip card (overlapping) ───────────────── */}
        <div className="px-4 -mb-6">
          <motion.div
            key={tipIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg shadow-emerald-900/10 p-4 flex items-start gap-3"
          >
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sun className="w-4 h-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-600 mb-0.5">💡 आजची टिप</p>
              <p className="text-sm text-slate-700 leading-relaxed">{dailyTips[tipIndex]}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Quick Actions Grid ─────────────────────── */}
      <div className="px-4 mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800">सेवा</h2>
          <span className="text-xs text-slate-400">सर्व वैशिष्ट्ये</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <Link key={action.href} href={action.href} className="group">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center shadow-md mb-1.5 group-active:scale-95 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[11px] font-medium text-slate-700 text-center leading-tight">
                  {action.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Market Summary Card ─────────────────────── */}
      {weather && (
        <div className="px-4 mt-6">
          <Link href="/markets" className="block">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">📊 बाजार सारांश</h3>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-emerald-50 rounded-xl">
                  <p className="text-lg font-bold text-emerald-700">{weather.total_commodities || '—'}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">पिके</p>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-xl">
                  <p className="text-lg font-bold text-amber-700">{weather.total_markets || '—'}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">बाजार</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-xl">
                  <p className="text-lg font-bold text-blue-700">{weather.total_records || '—'}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">नोंदी</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── Feature Highlight Cards ─────────────────── */}
      <div className="px-4 mt-6 space-y-3">
        <h2 className="text-base font-bold text-slate-800">प्रमुख वैशिष्ट्ये</h2>

        {/* Crop Analysis */}
        <Link href="/crop-analysis" className="block">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-white shadow-md flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">📸 पीक रोग ओळख</h3>
              <p className="text-xs text-emerald-100 mt-0.5">फोटो काढा → AI तात्काळ रोग ओळखतो → उपाय मिळवा</p>
            </div>
            <ArrowRight className="w-5 h-5 flex-shrink-0 opacity-70" />
          </div>
        </Link>

        {/* Price Forecast */}
        <Link href="/price-forecast" className="block">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-md flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">📈 भाव अंदाज</h3>
              <p className="text-xs text-amber-100 mt-0.5">15 दिवसांचा अंदाज → योग्य वेळी विक्री करा</p>
            </div>
            <ArrowRight className="w-5 h-5 flex-shrink-0 opacity-70" />
          </div>
        </Link>

        {/* Market Prices */}
        <Link href="/markets" className="block">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-4 text-white shadow-md flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">💰 आजचे मंडी भाव</h3>
              <p className="text-xs text-purple-100 mt-0.5">400+ बाजारांचे रिअल-टाइम दर</p>
            </div>
            <ArrowRight className="w-5 h-5 flex-shrink-0 opacity-70" />
          </div>
        </Link>
      </div>

      {/* ── Quick Help Section ──────────────────────── */}
      <div className="px-4 mt-6 mb-8">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-red-800">🚨 आपत्कालीन मदत</h3>
            <p className="text-xs text-red-600 mt-0.5">जनावरांसाठी तात्काळ डॉक्टर बोलवा</p>
          </div>
          <Link href="/dashboard/farmer" className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg flex-shrink-0">
            SOS
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Landing Page (for non-logged-in visitors) ───────────── */
function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30">
      <Navbar isScrolled={isScrolled} />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}

/* ── Page Router ─────────────────────────────────────────── */
export default function HomePage() {
  const { user, loading } = useAuth();

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center animate-pulse">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-slate-500">लोड होत आहे...</p>
        </div>
      </div>
    );
  }

  // Logged-in farmer → Dashboard
  if (user && user.role === 'farmer') {
    return <FarmerHome user={user} />;
  }

  // Everyone else → Landing page
  return <LandingPage />;
}
