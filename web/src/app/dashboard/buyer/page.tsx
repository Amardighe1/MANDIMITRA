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
  IndianRupee,
  Plus,
  Trash2,
  Loader2,
  LogOut,
  RefreshCw,
  Package,
  MapPin,
} from 'lucide-react';

type Tab = 'set-price' | 'my-prices';

interface Crop {
  id: string;
  name_mr: string;
  name_en: string;
}

interface PriceListing {
  id: string;
  crop_id: string;
  crop_name: string;
  market_name: string;
  price_per_quintal: number;
  updated_at: string;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = getToken();
  const res = await fetch(apiUrl(path), {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...opts?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'आत्ताच';
  if (mins < 60) return `${mins} मि. पूर्वी`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} तास पूर्वी`;
  return `${Math.floor(hrs / 24)} दिवस पूर्वी`;
}

export default function BuyerDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('set-price');

  // Crops & Markets
  const [crops, setCrops] = useState<Crop[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);

  // Set price form
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // My prices
  const [myPrices, setMyPrices] = useState<PriceListing[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);

  const fetchCropsAndMarkets = useCallback(async () => {
    try {
      const [cropsRes, marketsRes] = await Promise.all([
        apiFetch('/api/buyer/crops'),
        apiFetch('/api/buyer/markets'),
      ]);
      setCrops(cropsRes.crops);
      setMarkets(marketsRes.markets);
    } catch {}
  }, []);

  const fetchMyPrices = useCallback(async () => {
    setLoadingPrices(true);
    try {
      const { prices } = await apiFetch('/api/buyer/my-prices');
      setMyPrices(prices);
    } catch {}
    setLoadingPrices(false);
  }, []);

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'buyer')) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Fetch data on mount
  useEffect(() => {
    if (!user || user.role !== 'buyer') return;
    fetchCropsAndMarkets();
    fetchMyPrices();
  }, [user, fetchCropsAndMarkets, fetchMyPrices]);

  const handleSetPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop || !selectedMarket || !price) return;
    setSubmitting(true);
    setSuccessMsg('');
    try {
      const crop = crops.find((c) => c.id === selectedCrop);
      await apiFetch('/api/buyer/prices', {
        method: 'POST',
        body: JSON.stringify({
          crop_id: selectedCrop,
          crop_name: crop ? `${crop.name_mr} (${crop.name_en})` : selectedCrop,
          market_name: selectedMarket,
          price_per_quintal: parseFloat(price),
        }),
      });
      setSuccessMsg('किंमत यशस्वीरित्या सेट केली!');
      setPrice('');
      fetchMyPrices();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrice = async (priceId: string) => {
    if (!confirm('ही किंमत काढून टाकायची आहे का?')) return;
    try {
      await apiFetch(`/api/buyer/prices/${priceId}`, { method: 'DELETE' });
      fetchMyPrices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const tabItems = [
    { key: 'set-price' as Tab, label: 'किंमत सेट करा', icon: IndianRupee },
    { key: 'my-prices' as Tab, label: 'माझ्या किंमती', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                खरेदीदार पॅनेल
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 hidden sm:block">
                {user.full_name}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">लॉग आउट</span>
              </button>
            </div>
          </div>

          <div className="flex gap-1 -mb-px">
            {tabItems.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === t.key ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
                {tab === t.key && (
                  <motion.div layoutId="buyerTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== SET PRICE TAB ==================== */}
        {tab === 'set-price' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900">आजची किंमत सेट करा</h2>
              <p className="text-sm text-slate-500 mt-1">
                पीक निवडा, मंडी निवडा, आणि आजची किंमत प्रति क्विंटल टाका
              </p>
            </div>

            <form onSubmit={handleSetPrice} className="max-w-lg mx-auto space-y-5">
              <AnimatePresence>
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium text-center"
                  >
                    {successMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Market Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  मंडी / बाजार निवडा
                </label>
                <select
                  required
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-slate-900"
                >
                  <option value="">मंडी निवडा</option>
                  {markets.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Crop Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <Leaf className="w-4 h-4 inline mr-1" />
                  पीक निवडा
                </label>
                <select
                  required
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-slate-900"
                >
                  <option value="">पीक निवडा</option>
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_mr} ({c.name_en})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <IndianRupee className="w-4 h-4 inline mr-1" />
                  किंमत (₹ प्रति क्विंटल)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-slate-900 text-lg font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedCrop || !selectedMarket || !price}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    किंमत सेट करा
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ==================== MY PRICES TAB ==================== */}
        {tab === 'my-prices' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500" />
                माझ्या सध्याच्या किंमती
              </h2>
              <button
                onClick={fetchMyPrices}
                className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                रिफ्रेश
              </button>
            </div>

            {loadingPrices ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : myPrices.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <IndianRupee className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">अजून कोणतीही किंमत सेट केलेली नाही</p>
                <p className="text-sm text-slate-400 mt-1">
                  &quot;किंमत सेट करा&quot; टॅबवरून आजची किंमत सेट करा
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myPrices.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{p.crop_name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {p.market_name}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          अपडेट: {timeAgo(p.updated_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">
                            ₹{p.price_per_quintal.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-slate-400">प्रति क्विंटल</p>
                        </div>
                        <button
                          onClick={() => handleDeletePrice(p.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="काढून टाका"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
