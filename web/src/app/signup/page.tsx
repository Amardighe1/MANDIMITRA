'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth, SignupData, getToken } from '@/contexts/AuthContext';
import { Leaf, User, Stethoscope, ArrowRight, Loader2, Eye, EyeOff, Upload, FileCheck } from 'lucide-react';

type Role = 'farmer' | 'doctor';

export default function SignupPage() {
  const { signup } = useAuth();
  const [role, setRole] = useState<Role>('farmer');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Doctor fields
  const [vetLicense, setVetLicense] = useState('');
  const [vetCollege, setVetCollege] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'doctor' && !docFile) {
        setError('Please upload your veterinary license / ID document');
        setLoading(false);
        return;
      }

      const data: SignupData = {
        email,
        password,
        full_name: fullName,
        phone,
        role,
      };

      if (role === 'doctor') {
        data.veterinary_license = vetLicense;
        data.veterinary_college = vetCollege || undefined;
        data.specialization = specialization || undefined;
        data.years_of_experience = experience ? parseInt(experience) : undefined;
      }

      // 1. Create account
      await signup(data);

      // 2. Upload document if doctor (token is now stored after signup)
      if (role === 'doctor' && docFile) {
        try {
          const token = getToken();
          const fd = new FormData();
          fd.append('file', docFile);
          await fetch('/api/vet/doctor/upload-document', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
        } catch {
          // Account created; doc upload can be retried
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="mt-2 text-slate-500">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Role Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-100">
            {([
              { key: 'farmer' as Role, label: 'Farmer', icon: User },
              { key: 'doctor' as Role, label: 'Veterinary Doctor', icon: Stethoscope },
            ]).map((r) => (
              <button
                key={r.key}
                onClick={() => { setRole(r.key); setError(''); }}
                className={`relative flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                  role === r.key
                    ? r.key === 'farmer' ? 'text-emerald-600' : 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <r.icon className="w-4 h-4" />
                <span>{r.label}</span>
                {role === r.key && (
                  <motion.div
                    layoutId="signupTab"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      r.key === 'farmer' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900 pr-12"
                  placeholder="Min 6 characters"
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

            {/* Doctor-Specific Fields */}
            <AnimatePresence>
              {role === 'doctor' && (
                <motion.div
                  key="doctor-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
                      Veterinary Verification
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Veterinary License Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required={role === 'doctor'}
                      value={vetLicense}
                      onChange={(e) => setVetLicense(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                      placeholder="e.g. MH/VET/2024/12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Veterinary College</label>
                    <input
                      type="text"
                      value={vetCollege}
                      onChange={(e) => setVetCollege(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                      placeholder="College / university name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
                      <select
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900"
                      >
                        <option value="">Select</option>
                        <option value="Large Animal">Large Animal</option>
                        <option value="Small Animal">Small Animal</option>
                        <option value="Poultry">Poultry</option>
                        <option value="Mixed Practice">Mixed Practice</option>
                        <option value="Animal Nutrition">Animal Nutrition</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience (yrs)</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Verification Document <span className="text-red-400">*</span>
                    </label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all ${
                        docFile
                          ? 'border-blue-400 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      {docFile ? (
                        <>
                          <FileCheck className="w-5 h-5" />
                          <span className="truncate text-sm">{docFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span className="text-sm">Upload License / ID (image or PDF)</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                role === 'doctor'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/30'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create {role === 'doctor' ? 'Doctor' : 'Farmer'} Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-6 pb-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
