'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getToken } from '@/contexts/AuthContext';
import { apiUrl } from '@/lib/api-config';

const FarmerLocationMap = dynamic(
  () => import('@/components/map/FarmerLocationMap'),
  { ssr: false }
);
import {
  Stethoscope,
  AlertTriangle,
  Calendar,
  User,
  Loader2,
  Clock,
  LogOut,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  FileText,
  Upload,
  Shield,
  Activity,
  Award,
  Building,
  Briefcase,
  RefreshCw,
  Bell,
  BellRing,
  Zap,
  MessageCircle,
  Navigation,
} from 'lucide-react';

interface Emergency {
  id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_phone: string;
  animal_type: string;
  description: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  assigned_to: string | null;
  assigned_doctor_name: string | null;
  distance_km: number | null;
  created_at: string;
}

interface Booking {
  id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_phone: string;
  booking_date: string;
  time_slot: string;
  animal_type: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  specialization: string;
  years_of_experience: number | null;
  veterinary_license: string;
  veterinary_college: string;
  verification_status: string;
  verification_document_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  total_bookings: number;
  completed_bookings: number;
  handled_emergencies: number;
}

type Tab = 'emergencies' | 'bookings' | 'profile';

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
  if (!res.ok) throw new Error(data.detail || 'विनंती अयशस्वी झाली');
  return data;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5) return 'आत्ताच';
  if (secs < 60) return `${secs} से. पूर्वी`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} मि. पूर्वी`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ता. पूर्वी`;
  return `${Math.floor(hrs / 24)} दि. पूर्वी`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('mr-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DoctorDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('emergencies');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newEmergencyCount, setNewEmergencyCount] = useState(0);
  const prevEmergenciesRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationAddress, setLocationAddress] = useState('');
  const [mapEmergency, setMapEmergency] = useState<Emergency | null>(null);

  // Notification sound setup
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch('/api/vet/doctor/profile');
      setProfile(data);
      return data;
    } catch (e) {
      console.error('Profile fetch error:', e);
      return null;
    }
  }, []);

  const fetchEmergencies = useCallback(async () => {
    try {
      const { emergencies: data } = await apiFetch('/api/vet/doctor/emergency-cases');
      
      // Check for new emergencies
      const activeIds = (data || []).filter((e: Emergency) => e.status === 'active').map((e: Emergency) => e.id);
      const newOnes = activeIds.filter((id: string) => !prevEmergenciesRef.current.includes(id));
      
      if (newOnes.length > 0 && prevEmergenciesRef.current.length > 0) {
        setNewEmergencyCount((c) => c + newOnes.length);
        // Play notification sound
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }
      
      prevEmergenciesRef.current = activeIds;
      setEmergencies(data || []);
    } catch (e) {
      console.error('Emergencies fetch error:', e);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const { bookings: data } = await apiFetch('/api/vet/doctor/bookings');
      setBookings(data || []);
    } catch (e) {
      console.error('Bookings fetch error:', e);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchEmergencies(), fetchBookings()]);
    setLoading(false);
  }, [fetchProfile, fetchEmergencies, fetchBookings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
    setNewEmergencyCount(0);
  };

  // Auth check and initial fetch
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'doctor')) {
      router.replace('/login');
      return;
    }
    if (user?.role === 'doctor') fetchAll();
  }, [user, authLoading, router, fetchAll]);

  // Real-time polling for emergencies (every 5 seconds)
  useEffect(() => {
    if (!user || user.role !== 'doctor' || profile?.verification_status !== 'active') return;
    
    const interval = setInterval(() => {
      fetchEmergencies();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, profile?.verification_status, fetchEmergencies]);

  // Accept emergency
  const handleAcceptEmergency = async (emergencyId: string) => {
    setActionLoading(emergencyId);
    try {
      await apiFetch('/api/vet/doctor/accept-emergency', {
        method: 'POST',
        body: JSON.stringify({ emergency_id: emergencyId }),
      });
      await fetchEmergencies();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject emergency → escalate to next nearest doctor
  const handleRejectEmergency = async (emergencyId: string) => {
    setActionLoading(`reject-${emergencyId}`);
    try {
      const result = await apiFetch('/api/vet/doctor/reject-emergency', {
        method: 'POST',
        body: JSON.stringify({ emergency_id: emergencyId }),
      });
      if (result.next_doctor) {
        alert(`आपत्कालीन परिस्थिती डॉ. ${result.next_doctor} यांना पाठवली (${result.distance_km} कि.मी. दूर)`);
      } else {
        alert('जवळपास आणखी डॉक्टर उपलब्ध नाहीत. आपत्कालीन परिस्थिती स्वतः नियुक्तीसाठी सक्रिय आहे.');
      }
      await fetchEmergencies();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Update doctor location via GPS
  const handleUpdateLocation = async () => {
    if (!navigator.geolocation) {
      alert('तुमच्या ब्राउझरमध्ये जिओलोकेशन समर्थित नाही');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await apiFetch('/api/vet/doctor/update-location', {
            method: 'POST',
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              address: locationAddress || null,
            }),
          });
          await fetchProfile();
          alert('स्थान यशस्वीरीत्या अपडेट झाले!');
        } catch (e: any) {
          alert(e.message);
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        alert('तुमचे स्थान शोधता आले नाही. कृपया GPS सक्षम करा.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Complete emergency
  const handleCompleteEmergency = async (emergencyId: string) => {
    setActionLoading(`complete-${emergencyId}`);
    try {
      await apiFetch('/api/vet/doctor/complete-emergency', {
        method: 'POST',
        body: JSON.stringify({ emergency_id: emergencyId }),
      });
      await fetchEmergencies();
      await fetchProfile(); // Update stats
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Update booking status
  const handleBookingStatus = async (bookingId: string, status: string) => {
    setActionLoading(`booking-${bookingId}`);
    try {
      await apiFetch('/api/vet/doctor/booking-status', {
        method: 'POST',
        body: JSON.stringify({ booking_id: bookingId, status }),
      });
      await fetchBookings();
      await fetchProfile(); // Update stats
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Upload verification document
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = getToken();
      const res = await fetch(apiUrl('/api/vet/doctor/upload-document'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'अपलोड अयशस्वी झाले');

      alert('दस्तऐवज अपलोड झाला! अॅडमिन मंजुरीची प्रतीक्षा करा.');
      await fetchProfile();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isVerified = profile?.verification_status === 'active';
  const isPending = profile?.verification_status === 'pending_verification';
  const isRejected = profile?.verification_status === 'rejected';

  const activeEmergencies = emergencies.filter((e) => e.status === 'active');
  const myEmergencies = emergencies.filter((e) => e.status === 'accepted' || e.status === 'completed');
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    active: 'bg-red-100 text-red-700',
    accepted: 'bg-blue-100 text-blue-700',
  };

  const tabs = [
    {
      key: 'emergencies' as Tab,
      label: 'आपत्कालीन प्रकरणे',
      icon: AlertTriangle,
      badge: activeEmergencies.length,
      alert: activeEmergencies.length > 0,
    },
    { key: 'bookings' as Tab, label: 'माझी बुकिंग्ज', icon: Calendar, badge: pendingBookings.length },
    { key: 'profile' as Tab, label: 'प्रोफाइल', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900">डॉक्टर पोर्टल</span>
                <span className="hidden sm:inline text-xs text-slate-400 ml-2">MANDIMITRA</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="रिफ्रेश"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                {newEmergencyCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center animate-bounce">
                    {newEmergencyCount}
                  </span>
                )}
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
          {isVerified && (
            <div className="flex gap-1 -mb-px overflow-x-auto no-scrollbar">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setTab(t.key);
                    if (t.key === 'emergencies') setNewEmergencyCount(0);
                  }}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    tab === t.key ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <t.icon className={`w-4 h-4 ${t.alert ? 'animate-pulse' : ''}`} />
                  <span>{t.label}</span>
                  {t.badge && t.badge > 0 && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full min-w-[18px] text-center ${
                      t.alert ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {t.badge}
                    </span>
                  )}
                  {tab === t.key && (
                    <motion.div layoutId="doctorTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== VERIFICATION STATUS BANNER ==================== */}
        {!isVerified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-6 rounded-2xl border ${
              isPending
                ? 'bg-amber-50 border-amber-200'
                : isRejected
                ? 'bg-red-50 border-red-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                isPending ? 'bg-amber-100' : isRejected ? 'bg-red-100' : 'bg-slate-100'
              }`}>
                {isPending ? (
                  <Clock className="w-7 h-7 text-amber-600" />
                ) : isRejected ? (
                  <XCircle className="w-7 h-7 text-red-600" />
                ) : (
                  <Shield className="w-7 h-7 text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${
                  isPending ? 'text-amber-800' : isRejected ? 'text-red-800' : 'text-slate-800'
                }`}>
                  {isPending
                    ? 'पडताळणी प्रतीक्षेत'
                    : isRejected
                    ? 'पडताळणी नाकारली'
                    : 'तुमची पडताळणी पूर्ण करा'}
                </h3>
                <p className={`text-sm mt-1 ${
                  isPending ? 'text-amber-600' : isRejected ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {isPending
                    ? 'तुमचे दस्तऐवज तपासले जात आहेत. मंजुरी मिळाल्यावर तुम्हाला कळवले जाईल.'
                    : isRejected
                    ? 'कृपया पुन्हा अर्ज करण्यासाठी वैध पशुवैद्यकीय परवाना दस्तऐवज अपलोड करा.'
                    : 'रुग्ण स्वीकारणे सुरू करण्यासाठी तुमचा पशुवैद्यकीय परवाना दस्तऐवज अपलोड करा.'}
                </p>
              </div>
              {(!isPending || isRejected || !profile?.verification_document_url) && (
                <label className="flex-shrink-0">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUploadDocument}
                    disabled={uploading}
                  />
                  <div className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm cursor-pointer transition-colors ${
                    uploading
                      ? 'bg-slate-200 text-slate-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}>
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        दस्तऐवज अपलोड करा
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>
          </motion.div>
        )}

        {/* ==================== VERIFIED DOCTOR CONTENT ==================== */}
        {isVerified && (
          <>
            {/* Location Warning Banner */}
            {!profile?.latitude && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800">आपत्कालीन विनंत्या मिळवण्यासाठी तुमचे स्थान सेट करा</p>
                  <p className="text-sm text-amber-600">प्रोफाइल टॅब → आपत्कालीन स्थान वर जा GPS-आधारित आपत्कालीन जुळवणी सक्षम करण्यासाठी</p>
                </div>
                <button
                  onClick={() => setTab('profile')}
                  className="px-4 py-2 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors text-sm flex-shrink-0"
                >
                  स्थान सेट करा
                </button>
              </motion.div>
            )}
            {/* ==================== EMERGENCIES TAB ==================== */}
            {tab === 'emergencies' && (
              <div className="space-y-6">
                {/* Active Emergencies (SOS) */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <BellRing className="w-5 h-5 text-red-500" />
                    सक्रिय SOS विनंत्या
                    {activeEmergencies.length > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-semibold animate-pulse">
                        {activeEmergencies.length} सक्रिय
                      </span>
                    )}
                  </h2>

                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-40 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                      ))}
                    </div>
                  ) : activeEmergencies.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                      <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-600 font-medium">सध्या कोणतीही सक्रिय आपत्कालीन नाही</p>
                      <p className="text-sm text-slate-400 mt-1">नवीन विनंत्या आपोआप इथे दिसतील</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {activeEmergencies.map((emg) => (
                          <motion.div
                            key={emg.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="bg-white rounded-2xl border-2 border-red-200 shadow-lg shadow-red-100/50 p-5 ring-2 ring-red-100"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-red-100 text-red-700">
                                    🚨 SOS
                                  </span>
                                  <span className="text-xs text-slate-400">{timeAgo(emg.created_at)}</span>
                                  {emg.distance_km != null && (
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                      📍 {emg.distance_km} कि.मी. दूर
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-bold text-lg text-slate-900">{emg.animal_type}</h3>
                                <p className="text-slate-600 mt-1">{emg.description}</p>
                                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {emg.farmer_name || 'शेतकरी'}
                                  </span>
                                  {emg.farmer_phone && (
                                    <a
                                      href={`tel:${emg.farmer_phone}`}
                                      className="flex items-center gap-1 text-blue-600 hover:underline"
                                    >
                                      <Phone className="w-4 h-4" />
                                      {emg.farmer_phone}
                                    </a>
                                  )}
                                  {emg.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {emg.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleAcceptEmergency(emg.id)}
                                  disabled={actionLoading === emg.id}
                                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-lg"
                                >
                                  {actionLoading === emg.id ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                  ) : (
                                    <>
                                      <Zap className="w-6 h-6" />
                                      स्वीकारा
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleRejectEmergency(emg.id)}
                                  disabled={actionLoading === `reject-${emg.id}`}
                                  className="flex items-center justify-center gap-2 px-6 py-2 border-2 border-slate-300 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 text-sm"
                                >
                                  {actionLoading === `reject-${emg.id}` ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4" />
                                      नाकारा
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* My Accepted/Completed Emergencies */}
                {myEmergencies.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-blue-500" />
                      माझी आपत्कालीन प्रकरणे
                    </h2>
                    <div className="space-y-3">
                      {myEmergencies.map((emg) => (
                        <div
                          key={emg.id}
                          className={`bg-white rounded-2xl border shadow-sm p-5 ${
                            emg.status === 'accepted' ? 'border-blue-200' : 'border-slate-100'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              emg.status === 'accepted' ? 'bg-blue-100' : 'bg-emerald-100'
                            }`}>
                              {emg.status === 'accepted' ? (
                                <Clock className="w-5 h-5 text-blue-600" />
                              ) : (
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${statusColor[emg.status]}`}>
                                  {emg.status}
                                </span>
                                <span className="text-xs text-slate-400">{timeAgo(emg.created_at)}</span>
                              </div>
                              <h3 className="font-semibold text-slate-900">{emg.animal_type}</h3>
                              <p className="text-sm text-slate-600">{emg.description}</p>
                              <p className="text-sm text-slate-500 mt-1">
                                {emg.farmer_name} • {emg.farmer_phone}
                              </p>
                            </div>
                            {emg.status === 'accepted' && (
                              <div className="flex flex-wrap gap-2">
                                {emg.latitude && emg.longitude && (
                                  <button
                                    onClick={() => setMapEmergency(emg)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-lg shadow-blue-600/25"
                                  >
                                    <Navigation className="w-4 h-4" />
                                    नकाशा सुरू करा
                                  </button>
                                )}
                                {emg.farmer_phone && (
                                  <a
                                    href={`tel:${emg.farmer_phone}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                  >
                                    <Phone className="w-4 h-4" />
                                    कॉल करा
                                  </a>
                                )}
                                <button
                                  onClick={() => handleCompleteEmergency(emg.id)}
                                  disabled={actionLoading === `complete-${emg.id}`}
                                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                                >
                                  {actionLoading === `complete-${emg.id}` ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      पूर्ण करा
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== BOOKINGS TAB ==================== */}
            {tab === 'bookings' && (
              <div className="space-y-6">
                {/* Pending Confirmations */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-amber-500" />
                    प्रतीक्षेतील पुष्टीकरण
                    {pendingBookings.length > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-semibold">
                        {pendingBookings.length}
                      </span>
                    )}
                  </h2>

                  {loading ? (
                    <div className="h-40 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                  ) : pendingBookings.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                      <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                      <p className="text-sm text-slate-500">कोणतीही प्रतीक्षेतील बुकिंग नाही</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingBookings.map((b) => (
                        <motion.div
                          key={b.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">
                                  प्रतीक्षेत
                                </span>
                                <span className="text-xs text-slate-400">{timeAgo(b.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm mb-2">
                                <span className="font-semibold text-slate-900">{formatDate(b.booking_date)}</span>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                  {b.time_slot}
                                </span>
                              </div>
                              <p className="text-slate-600">
                                <span className="font-medium">{b.farmer_name || 'शेतकरी'}</span>
                                {b.animal_type && ` • ${b.animal_type}`}
                              </p>
                              {b.description && (
                                <p className="text-sm text-slate-500 mt-1 flex items-start gap-1">
                                  <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  {b.description}
                                </p>
                              )}
                              {b.farmer_phone && (
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5" />
                                  {b.farmer_phone}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleBookingStatus(b.id, 'confirmed')}
                                disabled={actionLoading === `booking-${b.id}`}
                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === `booking-${b.id}` ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-5 h-5" />
                                    पुष्टी करा
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleBookingStatus(b.id, 'cancelled')}
                                disabled={actionLoading === `booking-${b.id}`}
                                className="flex items-center gap-2 px-5 py-2.5 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-5 h-5" />
                                नाकारा
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirmed Appointments */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    आगामी अपॉइंटमेंट
                  </h2>

                  {confirmedBookings.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                      <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">कोणतीही आगामी अपॉइंटमेंट नाही</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {confirmedBookings.map((b) => (
                        <div key={b.id} className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 text-sm mb-2">
                                <span className="font-semibold text-slate-900">{formatDate(b.booking_date)}</span>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                  {b.time_slot}
                                </span>
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold uppercase">
                                  पुष्टी झाली
                                </span>
                              </div>
                              <p className="text-slate-600">
                                <span className="font-medium">{b.farmer_name || 'शेतकरी'}</span>
                                {b.animal_type && ` • ${b.animal_type}`}
                              </p>
                              {b.farmer_phone && (
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5" />
                                  {b.farmer_phone}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {b.farmer_phone && (
                                <a
                                  href={`tel:${b.farmer_phone}`}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                  <Phone className="w-4 h-4" />
                                  कॉल करा
                                </a>
                              )}
                              <button
                                onClick={() => handleBookingStatus(b.id, 'completed')}
                                disabled={actionLoading === `booking-${b.id}`}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                              >
                                {actionLoading === `booking-${b.id}` ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    पूर्ण करा
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* All Bookings (Completed) */}
                {bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled').length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-slate-500" />
                      मागील अपॉइंटमेंट
                    </h2>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                      <div className="divide-y divide-slate-100">
                        {bookings
                          .filter((b) => b.status === 'completed' || b.status === 'cancelled')
                          .slice(0, 10)
                          .map((b) => (
                            <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {b.farmer_name} • {b.animal_type || 'सामान्य'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatDate(b.booking_date)} at {b.time_slot}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-bold rounded-md uppercase ${statusColor[b.status]}`}>
                                {b.status}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== PROFILE TAB ==================== */}
            {tab === 'profile' && profile && (
              <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <div className="text-white min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold truncate">Dr. {profile.full_name}</h2>
                        <p className="text-blue-100">{profile.specialization || 'सामान्य पशुवैद्यक'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle className="w-4 h-4 text-emerald-300" />
                          <span className="text-sm text-emerald-200">सत्यापित डॉक्टर</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-slate-50 rounded-xl">
                        <div className="text-3xl font-bold text-blue-600">{profile.total_bookings}</div>
                        <div className="text-xs text-slate-500 mt-1">एकूण बुकिंग्ज</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-xl">
                        <div className="text-3xl font-bold text-emerald-600">{profile.completed_bookings}</div>
                        <div className="text-xs text-slate-500 mt-1">पूर्ण</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-xl">
                        <div className="text-3xl font-bold text-red-600">{profile.handled_emergencies}</div>
                        <div className="text-xs text-slate-500 mt-1">आपत्कालीन</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-xl">
                        <div className="text-3xl font-bold text-amber-600">
                          {profile.years_of_experience || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">वर्षे अनुभव</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="font-bold text-slate-900 mb-4">व्यावसायिक माहिती</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">फोन</p>
                        <p className="font-medium text-slate-900">{profile.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">विशेषज्ञता</p>
                        <p className="font-medium text-slate-900">{profile.specialization || 'सामान्य'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">परवाना क्रमांक</p>
                        <p className="font-medium text-slate-900 font-mono">{profile.veterinary_license || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">महाविद्यालय</p>
                        <p className="font-medium text-slate-900">{profile.veterinary_college || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">अनुभव</p>
                        <p className="font-medium text-slate-900">
                          {profile.years_of_experience != null ? `${profile.years_of_experience} वर्षे` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {profile.address && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">पत्ता</p>
                          <p className="font-medium text-slate-900">{profile.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Setup for Emergency Proximity */}
                <div className={`bg-white rounded-2xl border shadow-sm p-6 ${
                  !profile.latitude ? 'border-amber-200 ring-2 ring-amber-100' : 'border-slate-100'
                }`}>
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    आपत्कालीन स्थान
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {profile.latitude
                      ? 'तुमचे स्थान सेट आहे. जवळच्या शेतकऱ्यांकडून आपत्कालीन विनंत्या तुम्हाला पाठवल्या जातील.'
                      : 'तुमचे स्थान सेट करा जेणेकरून शेतकरी तुम्हाला आपत्कालीन परिस्थितीत शोधू शकतील. आपत्कालीन SOS विनंत्या मिळवण्यासाठी हे आवश्यक आहे.'}
                  </p>

                  {profile.latitude && profile.longitude && (
                    <div className="bg-emerald-50 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>सध्याचे: {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}</span>
                      {profile.address && <span className="text-emerald-500">({profile.address})</span>}
                    </div>
                  )}

                  {!profile.latitude && (
                    <div className="bg-amber-50 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-amber-700">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>स्थान सेट नाही — तुम्हाला आपत्कालीन विनंत्या मिळणार नाहीत!</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      placeholder="दवाखाना / परिसराचे नाव (ऐच्छिक)"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400 text-sm"
                    />
                    <button
                      onClick={handleUpdateLocation}
                      disabled={locationLoading}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {locationLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          {profile.latitude ? 'स्थान अपडेट करा' : 'माझे स्थान सेट करा'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Farmer Location Map Modal */}
      {mapEmergency && mapEmergency.latitude && mapEmergency.longitude && (
        <FarmerLocationMap
          farmerLat={mapEmergency.latitude}
          farmerLon={mapEmergency.longitude}
          farmerName={mapEmergency.farmer_name || 'शेतकरी'}
          animalType={mapEmergency.animal_type}
          onClose={() => setMapEmergency(null)}
        />
      )}
    </div>
  );
}
