'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getToken } from '@/contexts/AuthContext';
import { apiUrl } from '@/lib/api-config';
import { Navbar } from '@/components/layout/Navbar';
import {
  Stethoscope,
  AlertTriangle,
  Calendar,
  Loader2,
  CheckCircle,
  Clock,
  Phone,
  MapPin,
  Search,
  X,
  Award,
  Siren,
  ArrowLeft,
  Activity,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
  years_of_experience: number | null;
  veterinary_college: string | null;
  phone: string | null;
  address: string | null;
}

interface Booking {
  id: string;
  doctor_name: string;
  booking_date: string;
  time_slot: string;
  animal_type: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

interface Emergency {
  id: string;
  animal_type: string;
  description: string;
  location: string | null;
  status: string;
  doctor_name: string | null;
  assigned_doctor_name: string | null;
  distance_km: number | null;
  created_at: string;
}

type Tab = 'doctors' | 'bookings' | 'emergencies';

/* ── Helpers ───────────────────────────────────────────────────────────── */
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
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TIME_SLOTS = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
];

const ANIMAL_TYPES = ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Poultry', 'Horse', 'Dog', 'Cat', 'Other'];

/* ── Component ─────────────────────────────────────────────────────────── */
export default function VeterinaryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [tab, setTab] = useState<Tab>('doctors');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingBook, setLoadingBook] = useState(true);
  const [loadingEmg, setLoadingEmg] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Booking modal state
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookDate, setBookDate] = useState('');
  const [bookSlot, setBookSlot] = useState('');
  const [bookAnimal, setBookAnimal] = useState('');
  const [bookDesc, setBookDesc] = useState('');
  const [bookLoading, setBookLoading] = useState(false);

  // Emergency SOS modal state
  const [showSOS, setShowSOS] = useState(false);
  const [sosAnimal, setSosAnimal] = useState('');
  const [sosDesc, setSosDesc] = useState('');
  const [sosLocation, setSosLocation] = useState('');
  const [sosLoading, setSosLoading] = useState(false);
  const [sosLat, setSosLat] = useState<number | null>(null);
  const [sosLon, setSosLon] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [sosResult, setSosResult] = useState<{ doctor: string; distance: number } | null>(null);

  // Scroll listener for Navbar
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Data fetchers ──────────────────────────────────────────────────── */
  const fetchDoctors = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const { doctors: data } = await apiFetch('/api/vet/doctors');
      setDoctors(data || []);
    } catch {}
    setLoadingDocs(false);
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoadingBook(true);
    try {
      const { bookings: data } = await apiFetch('/api/vet/farmer/bookings');
      setBookings(data || []);
    } catch {}
    setLoadingBook(false);
  }, []);

  const fetchEmergencies = useCallback(async () => {
    setLoadingEmg(true);
    try {
      const { emergencies: data } = await apiFetch('/api/vet/farmer/emergencies');
      setEmergencies(data || []);
    } catch {}
    setLoadingEmg(false);
  }, []);

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'farmer')) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Fetch data on tab change
  useEffect(() => {
    if (!user || user.role !== 'farmer') return;
    if (tab === 'doctors') fetchDoctors();
    else if (tab === 'bookings') fetchBookings();
    else if (tab === 'emergencies') fetchEmergencies();
  }, [tab, user, fetchDoctors, fetchBookings, fetchEmergencies]);

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const handleBook = async () => {
    if (!bookingDoctor || !bookDate || !bookSlot) return;
    setBookLoading(true);
    try {
      await apiFetch('/api/vet/farmer/book', {
        method: 'POST',
        body: JSON.stringify({
          doctor_id: bookingDoctor.id,
          booking_date: bookDate,
          time_slot: bookSlot,
          animal_type: bookAnimal || null,
          description: bookDesc || null,
        }),
      });
      setBookingDoctor(null);
      setBookDate('');
      setBookSlot('');
      setBookAnimal('');
      setBookDesc('');
      setTab('bookings');
      fetchBookings();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBookLoading(false);
    }
  };

  // Auto-detect GPS when SOS modal opens
  useEffect(() => {
    if (!showSOS) return;
    setGpsStatus('loading');
    setSosResult(null);
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSosLat(pos.coords.latitude);
        setSosLon(pos.coords.longitude);
        setGpsStatus('success');
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [showSOS]);

  const handleSOS = async () => {
    if (!sosAnimal || !sosDesc) return;
    if (!sosLat || !sosLon) {
      alert('GPS location is required. Please enable location services and try again.');
      return;
    }
    setSosLoading(true);
    try {
      const result = await apiFetch('/api/vet/farmer/emergency', {
        method: 'POST',
        body: JSON.stringify({
          animal_type: sosAnimal,
          description: sosDesc,
          location: sosLocation || null,
          latitude: sosLat,
          longitude: sosLon,
        }),
      });
      if (result.assigned_doctor) {
        setSosResult({ doctor: result.assigned_doctor, distance: result.distance_km });
      }
      setSosAnimal('');
      setSosDesc('');
      setSosLocation('');
      setTab('emergencies');
      fetchEmergencies();
      // Close after a brief delay so user sees the assignment
      setTimeout(() => {
        setShowSOS(false);
        setSosResult(null);
      }, result.assigned_doctor ? 3000 : 500);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSosLoading(false);
    }
  };

  /* ── Loading ────────────────────────────────────────────────────────── */
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const filteredDoctors = doctors.filter(
    (d) =>
      d.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.specialization || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    active: 'bg-red-100 text-red-700',
    accepted: 'bg-blue-100 text-blue-700',
  };

  const tabItems = [
    { key: 'doctors' as Tab, label: 'Find Doctors', icon: Stethoscope },
    { key: 'bookings' as Tab, label: 'My Bookings', icon: Calendar, badge: bookings.filter((b) => b.status === 'confirmed').length },
    { key: 'emergencies' as Tab, label: 'My Emergencies', icon: AlertTriangle, badge: emergencies.filter((e) => e.status === 'active' || e.status === 'accepted').length },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <Navbar isScrolled={isScrolled} />

      {/* Page Header – below the navbar */}
      <div className="pt-20 lg:pt-24 pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb + SOS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                </div>
                Veterinary Services
              </h1>
              <p className="text-slate-500 mt-1">Book appointments & get emergency help for your animals</p>
            </div>
            <button
              onClick={() => setShowSOS(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors text-sm shadow-lg shadow-red-500/30 animate-pulse hover:animate-none"
            >
              <Siren className="w-5 h-5" />
              <span className="hidden sm:inline">Emergency SOS</span>
              <span className="sm:hidden">SOS</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar">
            {tabItems.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                  tab === t.key ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.badge !== undefined && t.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
                    {t.badge}
                  </span>
                )}
                {tab === t.key && (
                  <motion.div layoutId="vetTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== DOCTORS TAB ==================== */}
        {tab === 'doctors' && (
          <div className="space-y-5">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or specialization..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900 placeholder-slate-400"
              />
            </div>

            {loadingDocs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-52 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <Stethoscope className="w-14 h-14 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium text-lg">No verified doctors found</p>
                <p className="text-sm text-slate-400 mt-1">
                  {searchQuery ? 'Try a different search term' : 'Doctors will appear once verified by admin'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDoctors.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-emerald-200 group"
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                          <Stethoscope className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">Dr. {doc.full_name}</h3>
                          <p className="text-sm text-blue-600 font-medium">{doc.specialization || 'General Veterinary'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500">
                        {doc.years_of_experience != null && (
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                            <Award className="w-3 h-3" />
                            {doc.years_of_experience} yrs exp
                          </span>
                        )}
                        {doc.veterinary_college && (
                          <span className="bg-slate-50 px-2 py-1 rounded-md truncate max-w-[180px]">{doc.veterinary_college}</span>
                        )}
                      </div>

                      {doc.phone && (
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {doc.phone}
                        </p>
                      )}
                      {doc.address && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {doc.address}
                        </p>
                      )}
                    </div>

                    <div className="px-5 pb-5">
                      <button
                        onClick={() => {
                          setBookingDoctor(doc);
                          setBookDate('');
                          setBookSlot('');
                          setBookAnimal('');
                          setBookDesc('');
                        }}
                        className="w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Book Appointment
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== BOOKINGS TAB ==================== */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                My Bookings
              </h2>
              <span className="text-sm text-slate-400">{bookings.length} total</span>
            </div>

            {loadingBook ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <Calendar className="w-14 h-14 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium text-lg">No bookings yet</p>
                <p className="text-sm text-slate-400 mt-1">Browse doctors and book your first appointment</p>
                <button
                  onClick={() => setTab('doctors')}
                  className="mt-4 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors text-sm"
                >
                  Find a Doctor
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`bg-white rounded-2xl border shadow-sm p-5 transition-colors ${
                      b.status === 'confirmed' ? 'border-blue-200' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        b.status === 'confirmed'
                          ? 'bg-blue-100'
                          : b.status === 'completed'
                          ? 'bg-emerald-100'
                          : b.status === 'cancelled'
                          ? 'bg-red-100'
                          : 'bg-amber-100'
                      }`}>
                        {b.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">Dr. {b.doctor_name || 'Doctor'}</h3>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                              statusColor[b.status] || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {b.booking_date} &middot; {b.time_slot}
                          {b.animal_type && <> &middot; {b.animal_type}</>}
                        </p>
                        {b.description && <p className="text-sm text-slate-400 mt-1">{b.description}</p>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== EMERGENCIES TAB ==================== */}
        {tab === 'emergencies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                My Emergency Requests
              </h2>
              <button
                onClick={() => setShowSOS(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors text-sm"
              >
                <Siren className="w-4 h-4" />
                New SOS
              </button>
            </div>

            {loadingEmg ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : emergencies.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <AlertTriangle className="w-14 h-14 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium text-lg">No emergency requests</p>
                <p className="text-sm text-slate-400 mt-1">Use the Emergency SOS button for critical situations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencies.map((emg) => (
                  <motion.div
                    key={emg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`bg-white rounded-2xl border shadow-sm p-5 ${
                      emg.status === 'active'
                        ? 'border-red-200 ring-2 ring-red-100'
                        : emg.status === 'accepted'
                        ? 'border-blue-200'
                        : 'border-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          emg.status === 'active'
                            ? 'bg-red-100'
                            : emg.status === 'accepted'
                            ? 'bg-blue-100'
                            : 'bg-emerald-100'
                        }`}
                      >
                        {emg.status === 'active' ? (
                          <Activity className="w-5 h-5 text-red-600 animate-pulse" />
                        ) : emg.status === 'accepted' ? (
                          <Stethoscope className="w-5 h-5 text-blue-600" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                              statusColor[emg.status] || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {emg.status === 'active' ? '🚨 Live' : emg.status}
                          </span>
                          <span className="text-xs text-slate-400">{timeAgo(emg.created_at)}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900">
                          {emg.animal_type} — {emg.description}
                        </h3>
                        {emg.location && (
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {emg.location}
                          </p>
                        )}
                        {emg.status === 'active' && emg.assigned_doctor_name && (
                          <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Sent to Dr. {emg.assigned_doctor_name}
                            {emg.distance_km != null && ` (${emg.distance_km} km away)`}
                            {' — '}waiting for response...
                          </p>
                        )}
                        {emg.status === 'active' && !emg.assigned_doctor_name && (
                          <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Searching for nearby doctor...
                          </p>
                        )}
                        {emg.status === 'accepted' && emg.doctor_name && (
                          <p className="text-sm text-blue-600 font-medium mt-2 flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5" />
                            Dr. {emg.doctor_name} is responding to your case
                            {emg.distance_km != null && ` (${emg.distance_km} km away)`}
                          </p>
                        )}
                        {emg.status === 'completed' && (
                          <p className="text-sm text-emerald-600 font-medium mt-2 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Case resolved
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

      {/* ==================== BOOKING MODAL ==================== */}
      <AnimatePresence>
        {bookingDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setBookingDoctor(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Book Appointment</h2>
                  <button onClick={() => setBookingDoctor(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* Doctor Info */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Dr. {bookingDoctor.full_name}</p>
                    <p className="text-sm text-blue-600">{bookingDoctor.specialization || 'General Veterinary'}</p>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Appointment Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900"
                    required
                  />
                </div>

                {/* Time Slot */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Time Slot</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBookSlot(slot)}
                        className={`px-3 py-2 text-xs rounded-lg border transition-colors font-medium ${
                          bookSlot === slot
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-600 hover:border-emerald-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animal Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Animal Type</label>
                  <select
                    value={bookAnimal}
                    onChange={(e) => setBookAnimal(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900"
                  >
                    <option value="">Select animal</option>
                    {ANIMAL_TYPES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (optional)</label>
                  <textarea
                    value={bookDesc}
                    onChange={(e) => setBookDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900 placeholder-slate-400 resize-none"
                    placeholder="Describe the issue..."
                  />
                </div>

                <button
                  onClick={handleBook}
                  disabled={bookLoading || !bookDate || !bookSlot}
                  className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bookLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== EMERGENCY SOS MODAL ==================== */}
      <AnimatePresence>
        {showSOS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm" onClick={() => setShowSOS(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                    <Siren className="w-5 h-5" />
                    Emergency SOS
                  </h2>
                  <button onClick={() => { setShowSOS(false); setSosResult(null); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* GPS Status */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  gpsStatus === 'success' ? 'bg-emerald-50 text-emerald-700' :
                  gpsStatus === 'loading' ? 'bg-amber-50 text-amber-700' :
                  gpsStatus === 'error' ? 'bg-red-50 text-red-700' :
                  'bg-slate-50 text-slate-600'
                }`}>
                  <MapPin className={`w-4 h-4 ${gpsStatus === 'loading' ? 'animate-pulse' : ''}`} />
                  {gpsStatus === 'loading' && 'Detecting your location...'}
                  {gpsStatus === 'success' && `Location detected (${sosLat?.toFixed(4)}, ${sosLon?.toFixed(4)})`}
                  {gpsStatus === 'error' && 'Could not detect location. Please enable GPS.'}
                  {gpsStatus === 'idle' && 'Waiting for GPS...'}
                </div>

                {/* Success message after assignment */}
                {sosResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center"
                  >
                    <CheckCircle className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                    <p className="font-bold text-emerald-800">Emergency Sent!</p>
                    <p className="text-sm text-emerald-600 mt-1">
                      Assigned to <strong>Dr. {sosResult.doctor}</strong> ({sosResult.distance} km away)
                    </p>
                  </motion.div>
                )}

                {!sosResult && (
                  <>
                    <p className="text-sm text-slate-500">
                      Your emergency will be sent to the <strong>nearest available veterinary doctor</strong> automatically.
                    </p>

                    {/* Animal Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Animal Type <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={sosAnimal}
                        onChange={(e) => setSosAnimal(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all text-slate-900"
                        required
                      >
                        <option value="">Select animal</option>
                        {ANIMAL_TYPES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        What happened? <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={sosDesc}
                        onChange={(e) => setSosDesc(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all text-slate-900 placeholder-slate-400 resize-none"
                        placeholder="Describe the emergency..."
                        required
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Location (optional)</label>
                      <input
                        type="text"
                        value={sosLocation}
                        onChange={(e) => setSosLocation(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                        placeholder="Village / area name"
                      />
                    </div>

                    <button
                      onClick={handleSOS}
                      disabled={sosLoading || !sosAnimal || !sosDesc || gpsStatus !== 'success'}
                      className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
                    >
                      {sosLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Siren className="w-5 h-5" />
                          Send Emergency Alert
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
