'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Leaf, User, Stethoscope, ShieldCheck, ShoppingCart, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

type Role = 'farmer' | 'doctor' | 'buyer' | 'admin';

const roles = [
  { key: 'farmer' as Role, label: 'शेतकरी', icon: User, color: 'emerald' },
  { key: 'doctor' as Role, label: 'पशुवैद्यकीय डॉक्टर', icon: Stethoscope, color: 'blue' },
  { key: 'buyer' as Role, label: 'खरेदीदार', icon: ShoppingCart, color: 'purple' },
  { key: 'admin' as Role, label: 'अॅडमिन', icon: ShieldCheck, color: 'amber' },
];

export default function LoginPage() {
  const { login, adminVerify, adminLogin, user, logout } = useAuth();
  const [role, setRole] = useState<Role>('farmer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminStep, setAdminStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear any existing session when visiting login page
  useEffect(() => {
    if (user) {
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setAdminId('');
    setAdminStep(1);
    setError('');
    setShowPassword(false);
  };

  const handleRoleChange = (r: Role) => {
    setRole(r);
    resetForm();
  };

  const handleFarmerDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      console.log(`[Login] Submitting: email=${email}, role=${role}`);
      await login(email, password, role);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await adminVerify(adminId);
      if (ok) setAdminStep(2);
    } catch (err: any) {
      setError(err.message || 'Invalid Admin ID');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(adminId, email, password);
    } catch (err: any) {
      setError(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const accentMap: Record<Role, string> = {
    farmer: 'emerald',
    doctor: 'blue',
    buyer: 'purple',
    admin: 'amber',
  };
  const accent = accentMap[role];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">MANDIMITRA</span>
          </Link>
          <p className="mt-2 text-slate-500">तुमच्या खात्यात लॉग इन करा</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Role Tabs */}
          <div className="grid grid-cols-4 border-b border-slate-100">
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => handleRoleChange(r.key)}
                className={`relative flex flex-col items-center gap-1 py-3 sm:py-4 text-[10px] sm:text-xs font-medium transition-colors ${
                  role === r.key
                    ? r.key === 'farmer'
                      ? 'text-emerald-600'
                      : r.key === 'doctor'
                      ? 'text-blue-600'
                      : r.key === 'buyer'
                      ? 'text-purple-600'
                      : 'text-amber-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <r.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate max-w-full px-1">{r.label}</span>
                {role === r.key && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      r.key === 'farmer'
                        ? 'bg-emerald-500'
                        : r.key === 'doctor'
                        ? 'bg-blue-500'
                        : r.key === 'buyer'
                        ? 'bg-purple-500'
                        : 'bg-amber-500'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Farmer / Doctor Login */}
            {role !== 'admin' && (
              <motion.form
                key="user-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleFarmerDoctorLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">ईमेल</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">पासवर्ड</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    role === 'doctor'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30'
                      : role === 'buyer'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/30'
                  } disabled:opacity-50`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>लॉग इन <ArrowRight className="w-4 h-4" /></>}
                </button>
              </motion.form>
            )}

            {/* Admin Login – Step 1: ID Verification */}
            {role === 'admin' && adminStep === 1 && (
              <motion.form
                key="admin-step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleAdminVerify}
                className="space-y-4"
              >
                <div className="text-center mb-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-3">
                    <ShieldCheck className="w-7 h-7 text-amber-600" />
                  </div>
                  <p className="text-sm text-slate-500">पायरी 1 / 2 — अॅडमिन ओळख पडताळणी</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">अॅडमिन ID</label>
                  <input
                    type="text"
                    required
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-slate-900 placeholder-slate-400 text-center tracking-widest text-lg"
                    placeholder="अॅडमिन ID टाका"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>पडताळणी करा <ArrowRight className="w-4 h-4" /></>}
                </button>
              </motion.form>
            )}

            {/* Admin Login – Step 2: Credentials */}
            {role === 'admin' && adminStep === 2 && (
              <motion.form
                key="admin-step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleAdminLogin}
                className="space-y-4"
              >
                <div className="text-center mb-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-3">
                    <ShieldCheck className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="text-sm text-emerald-600 font-medium">ID पडताळणी व्हाली ✓</p>
                  <p className="text-sm text-slate-500">पायरी 2 / 2 — अॅडमिन माहिती टाका</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">ईमेल</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">पासवर्ड</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-slate-900 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>अॅडमिन लॉग इन <ArrowRight className="w-4 h-4" /></>}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdminStep(1); setError(''); }}
                  className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ← ID पडताळणीवर परत जा
                </button>
              </motion.form>
            )}
          </div>

          {/* Footer */}
          {role !== 'admin' && (
            <div className="px-6 pb-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors">
                नोंदणी करा
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
