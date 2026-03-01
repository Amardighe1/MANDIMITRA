'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getToken } from '@/contexts/AuthContext';
import { apiUrl } from '@/lib/api-config';
import {
  Shield,
  Users,
  Stethoscope,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Clock,
  LogOut,
  ExternalLink,
  Eye,
  UserCheck,
  UserX,
  Activity,
  TrendingUp,
  Phone,
  Mail,
  Award,
  Building,
  RefreshCw,
} from 'lucide-react';

interface DoctorProfile {
  id: string;
  full_name: string;
  email?: string;
  phone: string;
  specialization: string;
  years_of_experience: number | null;
  veterinary_license: string;
  veterinary_college: string;
  verification_document_url: string | null;
  verification_status: string;
  created_at: string;
}

interface Stats {
  total_farmers: number;
  active_doctors: number;
  pending_doctors: number;
  total_bookings: number;
  active_emergencies: number;
  total_emergencies: number;
}

interface Booking {
  id: string;
  farmer_name: string;
  doctor_name: string;
  booking_date: string;
  time_slot: string;
  animal_type: string | null;
  status: string;
  created_at: string;
}

interface Emergency {
  id: string;
  farmer_name: string;
  animal_type: string;
  description: string;
  location: string | null;
  status: string;
  doctor_name: string | null;
  created_at: string;
}

type Tab = 'overview' | 'verifications' | 'doctors' | 'bookings' | 'emergencies';

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
  if (hrs < 24) return `${hrs} ता. पूर्वी`;
  return `${Math.floor(hrs / 24)} दि. पूर्वी`;
}

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');

  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingDoctors, setPendingDoctors] = useState<DoctorProfile[]>([]);
  const [allDoctors, setAllDoctors] = useState<DoctorProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiFetch('/api/vet/admin/stats');
      setStats(data);
    } catch (e) {
      console.error('Stats fetch error:', e);
    }
  }, []);

  const fetchPendingDoctors = useCallback(async () => {
    try {
      const { doctors } = await apiFetch('/api/vet/admin/pending-doctors');
      setPendingDoctors(doctors || []);
    } catch (e) {
      console.error('Pending doctors fetch error:', e);
    }
  }, []);

  const fetchAllDoctors = useCallback(async () => {
    try {
      const { doctors } = await apiFetch('/api/vet/admin/all-doctors');
      setAllDoctors(doctors || []);
    } catch {}
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const { bookings: data } = await apiFetch('/api/vet/admin/all-bookings');
      setBookings(data || []);
    } catch {}
  }, []);

  const fetchEmergencies = useCallback(async () => {
    try {
      const { emergencies: data } = await apiFetch('/api/vet/admin/all-emergencies');
      setEmergencies(data || []);
    } catch {}
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchPendingDoctors()]);
    setLoading(false);
  }, [fetchStats, fetchPendingDoctors]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    if (tab === 'doctors') await fetchAllDoctors();
    if (tab === 'bookings') await fetchBookings();
    if (tab === 'emergencies') await fetchEmergencies();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/login');
      return;
    }
    if (user?.role === 'admin') fetchAll();
  }, [user, authLoading, router, fetchAll]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (tab === 'doctors') fetchAllDoctors();
    if (tab === 'bookings') fetchBookings();
    if (tab === 'emergencies') fetchEmergencies();
  }, [tab, user, fetchAllDoctors, fetchBookings, fetchEmergencies]);

  const handleVerify = async (doctorId: string, action: 'accept' | 'reject') => {
    setActionLoading(doctorId);
    try {
      await apiFetch('/api/vet/admin/verify-doctor', {
        method: 'POST',
        body: JSON.stringify({ doctor_id: doctorId, action }),
      });
      await fetchAll();
      if (tab === 'doctors') await fetchAllDoctors();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: 'एकूण शेतकरी', value: stats.total_farmers, icon: Users, color: 'emerald', trend: '+12%' },
        { label: 'सक्रिय डॉक्टर', value: stats.active_doctors, icon: UserCheck, color: 'blue', trend: '+5%' },
        { label: 'पडताळणी प्रतीक्षेत', value: stats.pending_doctors, icon: Clock, color: 'amber', alert: stats.pending_doctors > 0 },
        { label: 'एकूण बुकिंग्ज', value: stats.total_bookings, icon: Calendar, color: 'violet', trend: '+23%' },
        { label: 'सक्रिय आपत्कालीन', value: stats.active_emergencies, icon: AlertTriangle, color: 'red', alert: stats.active_emergencies > 0 },
        { label: 'निकाली प्रकरणे', value: stats.total_emergencies - stats.active_emergencies, icon: CheckCircle, color: 'slate' },
      ]
    : [];

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    violet: 'bg-violet-100 text-violet-600',
    red: 'bg-red-100 text-red-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    active: 'bg-red-100 text-red-700',
    accepted: 'bg-blue-100 text-blue-700',
    pending_verification: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const tabs = [
    { key: 'overview' as Tab, label: 'आढावा', icon: Activity },
    { key: 'verifications' as Tab, label: 'पडताळणी', icon: Clock, badge: stats?.pending_doctors },
    { key: 'doctors' as Tab, label: 'सर्व डॉक्टर', icon: Stethoscope },
    { key: 'bookings' as Tab, label: 'बुकिंग्ज', icon: Calendar },
    { key: 'emergencies' as Tab, label: 'आपत्कालीन विनंत्या', icon: AlertTriangle, badge: stats?.active_emergencies },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900">अॅडमिन पॅनेल</span>
                <span className="hidden sm:inline text-xs text-slate-400 ml-2">MANDIMITRA</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="रिफ्रेश"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">लॉग आउट</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  tab === t.key ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.badge && t.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
                    {t.badge}
                  </span>
                )}
                {tab === t.key && (
                  <motion.div layoutId="adminTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== OVERVIEW TAB ==================== */}
        {tab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                  ))
                : statCards.map((s) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white rounded-2xl border shadow-sm p-4 ${
                        s.alert ? 'border-red-200 ring-2 ring-red-100' : 'border-slate-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[s.color]}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-slate-500">{s.label}</span>
                        {s.trend && (
                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" />
                            {s.trend}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pending Verifications Quick View */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    प्रलंबित डॉक्टर पडताळणी
                  </h3>
                  <button
                    onClick={() => setTab('verifications')}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    सर्व पहा →
                  </button>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="h-32 animate-pulse bg-slate-100 rounded-xl" />
                  ) : pendingDoctors.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">सर्व पडताळणी पूर्ण</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingDoctors.slice(0, 3).map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{doc.full_name}</p>
                            <p className="text-xs text-slate-500">{doc.specialization || 'सामान्य'}</p>
                          </div>
                          <span className="text-xs text-amber-600">{timeAgo(doc.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Emergencies Quick View */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    सक्रिय आपत्कालीन
                  </h3>
                  <button
                    onClick={() => setTab('emergencies')}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    सर्व पहा →
                  </button>
                </div>
                <div className="p-4">
                  {stats?.active_emergencies === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">सध्या कोणतीही सक्रिय आपत्कालीन नाही</p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-4xl font-bold text-red-600 mb-1">{stats?.active_emergencies}</div>
                      <p className="text-sm text-slate-500">प्रतिसादाची प्रतीक्षा</p>
                      <button
                        onClick={() => setTab('emergencies')}
                        className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                      >
                        तपशील पहा
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== VERIFICATIONS TAB ==================== */}
        {tab === 'verifications' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              प्रलंबित डॉक्टर पडताळणी
              {pendingDoctors.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-semibold">
                  {pendingDoctors.length}
                </span>
              )}
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : pendingDoctors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1">सर्व पूर्ण!</h3>
                <p className="text-slate-500">कोणतीही प्रलंबित डॉक्टर पडताळणी नाही</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {pendingDoctors.map((doc) => (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                          {/* Doctor Info */}
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Stethoscope className="w-7 h-7 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900">{doc.full_name}</h3>
                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5" />
                                  {doc.phone || 'N/A'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">अर्ज केला {timeAgo(doc.created_at)}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <div>
                                  <p className="text-slate-400 text-xs">परवाना क्र.</p>
                                  <p className="text-slate-700 font-medium">{doc.veterinary_license || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-slate-400" />
                                <div>
                                  <p className="text-slate-400 text-xs">विशेषज्ञता</p>
                                  <p className="text-slate-700 font-medium">{doc.specialization || 'सामान्य'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-slate-400" />
                                <div>
                                  <p className="text-slate-400 text-xs">महाविद्यालय</p>
                                  <p className="text-slate-700 font-medium truncate">{doc.veterinary_college || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <div>
                                  <p className="text-slate-400 text-xs">अनुभव</p>
                                  <p className="text-slate-700 font-medium">
                                    {doc.years_of_experience != null ? `${doc.years_of_experience} वर्षे` : 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Document Preview */}
                            {doc.verification_document_url ? (
                              <a
                                href={doc.verification_document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                              >
                                <Eye className="w-4 h-4" />
                                पडताळणी दस्तऐवज पहा
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                                ⚠️ अजून दस्तऐवज अपलोड केले नाही
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex lg:flex-col gap-3 lg:min-w-[160px]">
                            <button
                              onClick={() => handleVerify(doc.id, 'accept')}
                              disabled={actionLoading === doc.id}
                              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === doc.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <>
                                  <UserCheck className="w-5 h-5" />
                                  स्वीकारा
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleVerify(doc.id, 'reject')}
                              disabled={actionLoading === doc.id}
                              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <UserX className="w-5 h-5" />
                              नाकारा
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* ==================== ALL DOCTORS TAB ==================== */}
        {tab === 'doctors' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-500" />
              सर्व नोंदणीकृत डॉक्टर
            </h2>

            {allDoctors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">अजून कोणतेही डॉक्टर नोंदणीकृत नाहीत</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">डॉक्टर</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">विशेषज्ञता</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">परवाना</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">स्थिती</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">कृती</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allDoctors.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Stethoscope className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{doc.full_name}</p>
                                <p className="text-xs text-slate-500">{doc.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{doc.specialization || 'सामान्य'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-mono">{doc.veterinary_license || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-md uppercase ${
                              statusColor[doc.verification_status] || 'bg-slate-100 text-slate-600'
                            }`}>
                              {doc.verification_status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {doc.verification_status === 'pending_verification' && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleVerify(doc.id, 'accept')}
                                  disabled={actionLoading === doc.id}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="स्वीकारा"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleVerify(doc.id, 'reject')}
                                  disabled={actionLoading === doc.id}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="नाकारा"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                            {doc.verification_document_url && (
                              <a
                                href={doc.verification_document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                                title="दस्तऐवज पहा"
                              >
                                <FileText className="w-5 h-5" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== BOOKINGS TAB ==================== */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-500" />
              सर्व बुकिंग्ज
            </h2>

            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">अजून बुकिंग नाही</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">शेतकरी</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">डॉक्टर</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">तारीख आणि वेळ</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">प्राणी</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">स्थिती</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{b.farmer_name || 'अज्ञात'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">डॉ. {b.doctor_name || 'अज्ञात'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {b.booking_date} <span className="text-slate-400">•</span> {b.time_slot}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{b.animal_type || '—'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-md uppercase ${statusColor[b.status]}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== EMERGENCIES TAB ==================== */}
        {tab === 'emergencies' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              सर्व आपत्कालीन विनंत्या
            </h2>

            {emergencies.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">कोणत्याही आपत्कालीन विनंत्या नाहीत</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencies.map((emg) => (
                  <motion.div
                    key={emg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`bg-white rounded-2xl border shadow-sm p-5 ${
                      emg.status === 'active' ? 'border-red-200 ring-2 ring-red-100' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        emg.status === 'active' ? 'bg-red-100' : emg.status === 'accepted' ? 'bg-blue-100' : 'bg-emerald-100'
                      }`}>
                        <AlertTriangle className={`w-6 h-6 ${
                          emg.status === 'active' ? 'text-red-600' : emg.status === 'accepted' ? 'text-blue-600' : 'text-emerald-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${statusColor[emg.status]}`}>
                            {emg.status}
                          </span>
                          <span className="text-xs text-slate-400">{timeAgo(emg.created_at)}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900">
                          {emg.animal_type} • {emg.description}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          शेतकरी: {emg.farmer_name || 'अज्ञात'}
                          {emg.location && <> • {emg.location}</>}
                        </p>
                        {emg.doctor_name && (
                          <p className="text-sm text-blue-600 font-medium mt-1">
                            डॉ. {emg.doctor_name} यांनी स्वीकारले
                          </p>
                        )}
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
