'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth, SignupData, getToken } from '@/contexts/AuthContext';
import { apiUrl } from '@/lib/api-config';
import { Leaf, User, Stethoscope, ShoppingCart, ArrowRight, Loader2, Eye, EyeOff, Upload, FileCheck } from 'lucide-react';

type Role = 'farmer' | 'doctor' | 'buyer';

export default function SignupPage() {
  const { signup, user, logout } = useAuth();
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

  // Buyer fields
  const [businessName, setBusinessName] = useState('');
  const [marketName, setMarketName] = useState('');
  const [district, setDistrict] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear any existing session when visiting signup page
  useEffect(() => {
    if (user) {
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'doctor' && !docFile) {
        setError('कृपया तुमचा पशुवैद्यकीय परवाना / ओळखपत्र अपलोड करा');
        setLoading(false);
        return;
      }

      if (role === 'buyer' && !businessName) {
        setError('कृपया तुमच्या व्यवसायाचे नाव टाका');
        setLoading(false);
        return;
      }

      if (role === 'buyer' && !marketName) {
        setError('कृपया मंडीचे नाव निवडा');
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

      if (role === 'buyer') {
        data.business_name = businessName;
        data.market_name = marketName;
        data.district = district || undefined;
      }

      // 1. Create account
      console.log(`[Signup] Submitting with role=${data.role}, email=${data.email}`);
      await signup(data);

      // 2. Upload document if doctor (token is now stored after signup)
      if (role === 'doctor' && docFile) {
        try {
          const token = getToken();
          const fd = new FormData();
          fd.append('file', docFile);
          await fetch(apiUrl('/api/vet/doctor/upload-document'), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
        } catch {
          // Account created; doc upload can be retried
        }
      }
    } catch (err: any) {
      setError(err.message || 'नोंदणी अयशस्वी झाली');
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
          <p className="mt-2 text-slate-500">तुमचे खाते तयार करा</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Role Tabs */}
          <div className="grid grid-cols-3 border-b border-slate-100">
            {([
              { key: 'farmer' as Role, label: 'शेतकरी', icon: User },
              { key: 'doctor' as Role, label: 'पशुवैद्यकीय डॉक्टर', icon: Stethoscope },
              { key: 'buyer' as Role, label: 'खरेदीदार', icon: ShoppingCart },
            ]).map((r) => (
              <button
                key={r.key}
                onClick={() => { setRole(r.key); setError(''); }}
                className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 text-[11px] sm:text-sm font-medium transition-colors ${
                  role === r.key
                    ? r.key === 'farmer' ? 'text-emerald-600' : r.key === 'doctor' ? 'text-blue-600' : 'text-purple-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <r.icon className="w-4 h-4" />
                <span className="truncate max-w-full text-center leading-tight">{r.label}</span>
                {role === r.key && (
                  <motion.div
                    layoutId="signupTab"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      r.key === 'farmer' ? 'bg-emerald-500' : r.key === 'doctor' ? 'bg-blue-500' : 'bg-purple-500'
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">पूर्ण नाव</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                placeholder="तुमचे पूर्ण नाव टाका"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">फोन नंबर</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                placeholder="१० अंकी मोबाईल नंबर"
                pattern="[0-9]{10}"
              />
            </div>

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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-900 pr-12"
                  placeholder="किमान ६ अक्षरे"
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
                      पशुवैद्यकीय पडताळणी
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      पशुवैद्यकीय परवाना क्रमांक <span className="text-red-400">*</span>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">पशुवैद्यकीय महाविद्यालय</label>
                    <input
                      type="text"
                      value={vetCollege}
                      onChange={(e) => setVetCollege(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                      placeholder="महाविद्यालय / विद्यापीठ नाव"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">विशेषज्ञता</label>
                      <select
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900"
                      >
                        <option value="">निवडा</option>
                        <option value="Large Animal">मोठे प्राणी</option>
                        <option value="Small Animal">लहान प्राणी</option>
                        <option value="Poultry">कुक्कुटपालन</option>
                        <option value="Mixed Practice">मिश्र प्रॅक्टिस</option>
                        <option value="Animal Nutrition">पशु पोषण</option>
                        <option value="Other">इतर</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">अनुभव (वर्षे)</label>
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
                      पडताळणी दस्तऐवज <span className="text-red-400">*</span>
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
                          <span className="text-sm">परवाना / ओळखपत्र अपलोड करा (फोटो किंवा PDF)</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buyer-Specific Fields */}
            <AnimatePresence>
              {role === 'buyer' && (
                <motion.div
                  key="buyer-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-3">
                      खरेदीदार माहिती
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      व्यवसायाचे नाव <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required={role === 'buyer'}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                      placeholder="उदा. शर्मा ट्रेडिंग कंपनी"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      मंडी / बाजार <span className="text-red-400">*</span>
                    </label>
                    <select
                      required={role === 'buyer'}
                      value={marketName}
                      onChange={(e) => setMarketName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-slate-900"
                    >
                      <option value="">मंडी निवडा</option>
                      <option value="पुणे मंडी">पुणे मंडी</option>
                      <option value="नाशिक मंडी">नाशिक मंडी</option>
                      <option value="नागपूर मंडी">नागपूर मंडी</option>
                      <option value="औरंगाबाद मंडी">औरंगाबाद मंडी</option>
                      <option value="सोलापूर मंडी">सोलापूर मंडी</option>
                      <option value="कोल्हापूर मंडी">कोल्हापूर मंडी</option>
                      <option value="सांगली मंडी">सांगली मंडी</option>
                      <option value="अमरावती मंडी">अमरावती मंडी</option>
                      <option value="अकोला मंडी">अकोला मंडी</option>
                      <option value="लातूर मंडी">लातूर मंडी</option>
                      <option value="जळगाव मंडी">जळगाव मंडी</option>
                      <option value="अहमदनगर मंडी">अहमदनगर मंडी</option>
                      <option value="सातारा मंडी">सातारा मंडी</option>
                      <option value="बारामती मंडी">बारामती मंडी</option>
                      <option value="मालेगाव मंडी">मालेगाव मंडी</option>
                      <option value="वाशी (नवी मुंबई) मंडी">वाशी (नवी मुंबई) मंडी</option>
                      <option value="मुंबई APMC मंडी">मुंबई APMC मंडी</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">जिल्हा</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                      placeholder="उदा. पुणे"
                    />
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
                  : role === 'buyer'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/30'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {role === 'doctor' ? 'डॉक्टर' : role === 'buyer' ? 'खरेदीदार' : 'शेतकरी'} खाते तयार करा
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-6 pb-6 text-center text-sm text-slate-500">
            आधीच खाते आहे?{' '}
            <Link href="/login" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors">
              लॉग इन करा
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
