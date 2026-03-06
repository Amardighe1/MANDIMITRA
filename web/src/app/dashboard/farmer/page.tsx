'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getToken } from '@/contexts/AuthContext';
import { apiUrl } from '@/lib/api-config';
import {
  Leaf,
  Stethoscope,
  AlertTriangle,
  Calendar,
  User,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  MapPin,
  LogOut,
  Search,
  X,
  Award,
  Siren,
} from 'lucide-react';

type Tab = 'doctors' | 'bookings' | 'emergencies';

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
  created_at: string;
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

const ANIMAL_TYPES = ['गाय', 'म्हैस', 'बकरी', 'मेंढी', 'कुक्कुटपालन', 'घोडा', 'कुत्रा', 'मांजर', 'इतर'];

export default function FarmerDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
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



  const fetchDoctors = useCallback(async () => {
    try {
      const { doctors: data } = await apiFetch('/api/vet/doctors');
      setDoctors(data);
    } catch {}
    setLoadingDocs(false);
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const { bookings: data } = await apiFetch('/api/vet/farmer/bookings');
      setBookings(data);
    } catch {}
    setLoadingBook(false);
  }, []);

  const fetchEmergencies = useCallback(async () => {
    try {
      const { emergencies: data } = await apiFetch('/api/vet/farmer/emergencies');
      setEmergencies(data);
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

  const handleSOS = async () => {
    if (!sosAnimal || !sosDesc) return;
    setSosLoading(true);
    try {
      await apiFetch('/api/vet/farmer/emergency', {
        method: 'POST',
        body: JSON.stringify({
          animal_type: sosAnimal,
          description: sosDesc,
          location: sosLocation || null,
        }),
      });
      setShowSOS(false);
      setSosAnimal('');
      setSosDesc('');
      setSosLocation('');
      setTab('emergencies');
      fetchEmergencies();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSosLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    { key: 'doctors' as Tab, label: 'डॉक्टर शोधा', icon: Stethoscope },
    { key: 'bookings' as Tab, label: 'माझी बुकिंग्ज', icon: Calendar },
    { key: 'emergencies' as Tab, label: 'आपत्कालीन', icon: AlertTriangle },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gradient">शेतकरी पॅनेल</span>
            </Link>
            <div className="flex items-center gap-3">
              {/* SOS Button */}
              <button
                onClick={() => setShowSOS(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors text-sm shadow-lg shadow-red-500/30 animate-pulse hover:animate-none"
              >
                <Siren className="w-4 h-4" />
                <span className="hidden sm:inline">आपत्कालीन SOS</span>
                <span className="sm:hidden">SOS</span>
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

          <div className="flex gap-1 -mb-px">
            {tabItems.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === t.key ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
                {tab === t.key && (
                  <motion.div layoutId="farmerTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== DOCTORS TAB ==================== */}
        {tab === 'doctors' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="नाव किंवा विशेषतेनुसार डॉक्टर शोधा..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            {loadingDocs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">कोणतेही सत्यापित डॉक्टर सापडले नाहीत</p>
                <p className="text-sm text-slate-400 mt-1">
                  {searchQuery ? 'वेगळा शोध शब्द वापरा' : 'प्रशासकाने सत्यापित केल्यावर डॉक्टर दिसतील'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDoctors.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{doc.full_name}</h3>
                        {doc.specialization && (
                          <p className="text-sm text-blue-600 font-medium">{doc.specialization}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                          {doc.years_of_experience != null && (
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                              <Award className="w-3 h-3" />
                              {doc.years_of_experience} वर्षे अनुभव
                            </span>
                          )}
                          {doc.veterinary_college && (
                            <span className="bg-slate-50 px-2 py-1 rounded-md truncate max-w-[160px]">
                              {doc.veterinary_college}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setBookingDoctor(doc);
                        setBookDate('');
                        setBookSlot('');
                        setBookAnimal('');
                        setBookDesc('');
                      }}
                      className="mt-4 w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      अपॉइंटमेंट बुक करा
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== BOOKINGS TAB ==================== */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              माझी बुकिंग्ज
            </h2>

            {loadingBook ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">अजून बुकिंग नाही</p>
                <p className="text-sm text-slate-400 mt-1">सत्यापित डॉक्टरांशी अपॉइंटमेंट बुक करा</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">डॉ. {b.doctor_name || 'डॉक्टर'}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${statusColor[b.status] || 'bg-slate-100 text-slate-600'}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {b.booking_date} &middot; {b.time_slot}
                      {b.animal_type && <> &middot; {b.animal_type}</>}
                    </p>
                    {b.description && <p className="text-sm text-slate-400 mt-1">{b.description}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== EMERGENCIES TAB ==================== */}
        {tab === 'emergencies' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              माझ्या आपत्कालीन विनंत्या
            </h2>

            {loadingEmg ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : emergencies.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">सध्या कोणतीही आपत्कालीन विनंती नाही</p>
                <p className="text-sm text-slate-400 mt-1">गंभीर परिस्थितीसाठी आपत्कालीन SOS बटण वापरा</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencies.map((emg) => (
                  <motion.div
                    key={emg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${statusColor[emg.status] || 'bg-slate-100 text-slate-600'}`}>
                        {emg.status}
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
                    {emg.status === 'accepted' && emg.doctor_name && (
                      <p className="text-sm text-blue-600 font-medium mt-2 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5" />
                        डॉ. {emg.doctor_name} यांनी तुमची विनंती स्वीकारली
                      </p>
                    )}
                    {emg.status === 'completed' && (
                      <p className="text-sm text-emerald-600 font-medium mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        प्रकरण निकाली निघाले
                      </p>
                    )}
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
                  <h2 className="text-lg font-bold text-slate-900">अपॉइंटमेंट बुक करा</h2>
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
                    <p className="font-semibold text-slate-900">डॉ. {bookingDoctor.full_name}</p>
                    <p className="text-sm text-blue-600">{bookingDoctor.specialization || 'सामान्य पशुवैद्यकीय'}</p>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">अपॉइंटमेंट तारीख</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">वेळ निवडा</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">प्राण्याचा प्रकार</label>
                  <select
                    value={bookAnimal}
                    onChange={(e) => setBookAnimal(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900"
                  >
                    <option value="">प्राणी निवडा</option>
                    {ANIMAL_TYPES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">वर्णन (ऐच्छिक)</label>
                  <textarea
                    value={bookDesc}
                    onChange={(e) => setBookDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900 placeholder-slate-400 resize-none"
                    placeholder="समस्येचे वर्णन करा..."
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
                      बुकिंग पुष्टी करा
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
                    आपत्कालीन SOS
                  </h2>
                  <button onClick={() => setShowSOS(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <p className="text-sm text-slate-500">
                  हे <strong>सर्व जवळच्या पशुवैद्यकीय डॉक्टरांना</strong> तातडीचा इशारा पाठवते. फक्त गंभीर परिस्थितीत वापरा.
                </p>

                {/* Animal Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">प्राण्याचा प्रकार <span className="text-red-400">*</span></label>
                  <select
                    value={sosAnimal}
                    onChange={(e) => setSosAnimal(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all text-slate-900"
                    required
                  >
                    <option value="">प्राणी निवडा</option>
                    {ANIMAL_TYPES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">काय झाले? <span className="text-red-400">*</span></label>
                  <textarea
                    value={sosDesc}
                    onChange={(e) => setSosDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all text-slate-900 placeholder-slate-400 resize-none"
                    placeholder="आपत्कालीन परिस्थितीचे वर्णन करा..."
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">स्थान</label>
                  <input
                    type="text"
                    value={sosLocation}
                    onChange={(e) => setSosLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                    placeholder="गाव / परिसराचे नाव"
                  />
                </div>

                <button
                  onClick={handleSOS}
                  disabled={sosLoading || !sosAnimal || !sosDesc}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
                >
                  {sosLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Siren className="w-5 h-5" />
                      आपत्कालीन इशारा पाठवा
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
