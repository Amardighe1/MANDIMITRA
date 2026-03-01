'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getToken } from '@/contexts/AuthContext';
import { apiUrl } from '@/lib/api-config';
import {
  Leaf,
  ShoppingCart,
  Search,
  MapPin,
  Phone,
  Loader2,
  LogOut,
  IndianRupee,
  ArrowLeft,
  Star,
  Building2,
  User,
  ChevronDown,
} from 'lucide-react';

interface Crop {
  id: string;
  name_mr: string;
  name_en: string;
}

interface Buyer {
  id?: string;
  buyer_name: string;
  buyer_phone?: string;
  business_name?: string;
  market_name: string;
  price_per_quintal: number;
}

async function apiFetch(path: string) {
  const token = getToken();
  const res = await fetch(apiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export default function MandiPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [markets, setMarkets] = useState<string[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Auth guard — only farmers
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'farmer')) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Load markets + crops on mount
  useEffect(() => {
    if (!user || user.role !== 'farmer') return;
    (async () => {
      try {
        const [cropsRes, marketsRes] = await Promise.all([
          apiFetch('/api/buyer/crops'),
          apiFetch('/api/buyer/markets'),
        ]);
        setCrops(cropsRes.crops || []);
        setMarkets(marketsRes.markets || []);
      } catch {}
      setDataLoaded(true);
    })();
  }, [user]);

  const searchBuyers = useCallback(async () => {
    if (!selectedMarket || !selectedCrop) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await apiFetch(
        `/api/buyer/search?market=${encodeURIComponent(selectedMarket)}&crop=${encodeURIComponent(selectedCrop)}`
      );
      setBuyers(data.buyers || []);
    } catch {
      setBuyers([]);
    }
    setLoading(false);
  }, [selectedMarket, selectedCrop]);

  const selectedCropObj = crops.find((c) => c.id === selectedCrop);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-emerald-50/30">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/40 via-white to-emerald-50/30">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-purple-100/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 -ml-2 rounded-xl hover:bg-purple-50 transition-colors"
                title="मुख्यपृष्ठ"
              >
                <ArrowLeft className="w-5 h-5 text-slate-500" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/20">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-slate-900 leading-tight">मंडी विक्री</h1>
                  <p className="text-[11px] text-purple-500 font-medium -mt-0.5">खरेदीदार शोधा • सर्वोत्तम भाव मिळवा</p>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">बाहेर पडा</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-100/70 text-purple-700 rounded-full text-sm font-medium mb-4">
            <IndianRupee className="w-3.5 h-3.5" />
            आजचे खरेदीदार भाव
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            तुमच्या मंडीतील <span className="text-purple-600">सर्वोत्तम खरेदीदार</span> शोधा
          </h2>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm sm:text-base">
            मंडी आणि पीक निवडा, सर्वोत्तम किमतीचे खरेदीदार त्यांच्या संपर्क माहितीसह पहा
          </p>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-purple-100/60 shadow-lg shadow-purple-100/20 p-5 sm:p-8 mb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Market Select */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
                <MapPin className="w-4 h-4 text-purple-500" />
                मंडी / बाजार
              </label>
              <div className="relative">
                <select
                  value={selectedMarket}
                  onChange={(e) => { setSelectedMarket(e.target.value); setSearched(false); }}
                  className="w-full appearance-none px-4 py-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-slate-900 font-medium"
                >
                  <option value="">मंडी निवडा...</option>
                  {markets.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Crop Select */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
                <Leaf className="w-4 h-4 text-emerald-500" />
                पीक
              </label>
              <div className="relative">
                <select
                  value={selectedCrop}
                  onChange={(e) => { setSelectedCrop(e.target.value); setSearched(false); }}
                  className="w-full appearance-none px-4 py-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-slate-900 font-medium"
                >
                  <option value="">पीक निवडा...</option>
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_mr} ({c.name_en})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={searchBuyers}
            disabled={!selectedMarket || !selectedCrop || loading}
            className="mt-6 w-full sm:w-auto sm:min-w-[240px] sm:mx-auto sm:flex py-3.5 px-8 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-purple-500/40 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                खरेदीदार शोधा
              </>
            )}
          </button>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {searched && !loading && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {buyers.length > 0 ? (
                      <>
                        <span className="text-purple-600">{buyers.length}</span> खरेदीदार सापडले
                      </>
                    ) : (
                      'कोणतेही खरेदीदार सापडले नाहीत'
                    )}
                  </h3>
                  {buyers.length > 0 && selectedCropObj && (
                    <p className="text-sm text-slate-500 mt-0.5">
                      {selectedMarket} • {selectedCropObj.name_mr} • सर्वोत्तम किंमत प्रथम
                    </p>
                  )}
                </div>
              </div>

              {buyers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl border border-dashed border-purple-200 p-12 sm:p-16 text-center"
                >
                  <div className="w-16 h-16 mx-auto bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                    <ShoppingCart className="w-8 h-8 text-purple-300" />
                  </div>
                  <p className="text-slate-700 font-semibold text-lg">या मंडी आणि पिकासाठी खरेदीदार नाहीत</p>
                  <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
                    वेगळे मंडी किंवा पीक निवडून पुन्हा प्रयत्न करा
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {buyers.map((buyer, idx) => (
                    <motion.div
                      key={buyer.id || idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06, type: 'spring', stiffness: 300, damping: 30 }}
                      className={`relative bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden ${
                        idx === 0
                          ? 'border-purple-200 shadow-purple-100/40 ring-1 ring-purple-100'
                          : 'border-slate-100'
                      }`}
                    >
                      {/* Best Price Badge */}
                      {idx === 0 && (
                        <div className="absolute top-0 right-0">
                          <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            सर्वोत्तम किंमत
                          </div>
                        </div>
                      )}

                      <div className="p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          {/* Buyer Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                idx === 0 ? 'bg-purple-100' : 'bg-slate-100'
                              }`}>
                                <User className={`w-5 h-5 ${idx === 0 ? 'text-purple-600' : 'text-slate-500'}`} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 truncate">
                                  {buyer.buyer_name || 'खरेदीदार'}
                                </h4>
                                {buyer.business_name && (
                                  <div className="flex items-center gap-1 text-sm text-purple-600 font-medium">
                                    <Building2 className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{buyer.business_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Contact & Location */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                              {buyer.buyer_phone && (
                                <a
                                  href={`tel:${buyer.buyer_phone}`}
                                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  {buyer.buyer_phone}
                                </a>
                              )}
                              <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {buyer.market_name}
                              </span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="flex-shrink-0 text-right">
                            <div className={`inline-flex items-baseline gap-0.5 px-3 py-1.5 rounded-xl ${
                              idx === 0
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              <span className="text-lg font-extrabold">
                                ₹{buyer.price_per_quintal?.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 font-medium">प्रति क्विंटल</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial State — before search */}
        {!searched && dataLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 sm:py-16"
          >
            <div className="w-20 h-20 mx-auto bg-purple-50 rounded-3xl flex items-center justify-center mb-5">
              <Search className="w-9 h-9 text-purple-300" />
            </div>
            <p className="text-slate-500 font-medium">मंडी आणि पीक निवडा, नंतर शोधा दाबा</p>
            <p className="text-sm text-slate-400 mt-1">खरेदीदारांचे भाव आणि संपर्क माहिती दिसेल</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
