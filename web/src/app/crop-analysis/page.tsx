'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getToken } from '@/contexts/AuthContext';
import { apiUrl } from '@/lib/api-config';
import { analyzeLocally, preloadModel, isModelLoaded } from '@/lib/crop-disease-local';
import {
  Leaf,
  Camera,
  Upload,
  ShieldCheck,
  Bug,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  Info,
  ArrowLeft,
  Microscope,
  Sprout,
  Zap,
  RotateCcw,
  ImagePlus,
} from 'lucide-react';

interface DiseaseResult {
  crop: string;
  disease: string | null;
  is_healthy: boolean;
  predicted_class: string;
  confidence: number;
  top_predictions: Array<{ class: string; confidence: number }>;
  advice: {
    status: string;
    summary: string;
    description: string;
    disease_name?: string;
    causes?: string;
    symptoms?: string[];
    treatment?: Array<{ method: string; name: string; details: string }>;
    preventive_tips: string[];
    severity?: string;
    recommended_actions: string[];
  };
  model_accuracy: number;
  treatment?: {
    disease_name_en: string;
    disease_name_mr: string;
    pathogen: string;
    severity: string;
    summary_mr: string;
    medicines: {
      treatments: Array<{
        name: string;
        name_mr: string;
        type: string;
        dosage: string;
        dosage_mr: string;
        application: string;
        application_mr: string;
      }>;
      prevention_mr?: string[];
    };
    soil_minerals: {
      deficiencies: Array<{
        mineral: string;
        mineral_mr: string;
        relation: string;
        relation_mr: string;
        remedy: string;
        remedy_mr: string;
      }>;
      general_advice_mr?: string;
    };
  };
}

const SUPPORTED_CROPS = [
  { name: 'मका (Corn)', emoji: '🌽', diseases: ['सामान्य गंज', 'राखाडी पानावरील डाग', 'उत्तरी पान करपा'] },
  { name: 'बटाटा (Potato)', emoji: '🥔', diseases: ['लवकर करपा', 'उशिरा करपा'] },
  { name: 'तांदूळ (Rice)', emoji: '🌾', diseases: ['तपकिरी ठिपके', 'पान करपा', 'मान करपा'] },
  { name: 'ऊस (Sugarcane)', emoji: '🎋', diseases: ['जिवाणू करपा', 'लाल कुज'] },
  { name: 'गहू (Wheat)', emoji: '🌿', diseases: ['तपकिरी गंज', 'पिवळा गंज'] },
];

export default function CropAnalysisPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [inferenceMode, setInferenceMode] = useState<'cloud' | 'on-device' | ''>('');

  // Preload TF.js model in background on mount
  useEffect(() => {
    preloadModel().then((ok) => {
      if (ok) console.log('[CropDisease] On-device model ready');
    });
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'farmer')) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('कृपया एक इमेज फाइल निवडा (JPG, PNG)');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('इमेज 10MB पेक्षा कमी असणे आवश्यक आहे');
      return;
    }
    setFile(selectedFile);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    setInferenceMode('');

    // Strategy: try cloud API first (has Gemini advice), fall back to on-device
    const baseUrl = apiUrl('/api/crop-disease/analyze');
    let usedCloud = false;

    if (baseUrl) {
      try {
        const token = getToken();
        const formData = new FormData();
        formData.append('file', file);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'विश्लेषण अयशस्वी');
        setResult(data);
        setInferenceMode('cloud');
        setShowDetails(true);
        usedCloud = true;
      } catch (cloudErr: any) {
        console.warn('[CropDisease] Cloud API unavailable, falling back to on-device:', cloudErr.message);
      }
    }

    // Fallback: on-device inference with TF.js
    if (!usedCloud) {
      try {
        const localResult = await analyzeLocally(file);
        setResult(localResult as any);
        setInferenceMode('on-device');
        setShowDetails(true);
      } catch (localErr: any) {
        setError(
          baseUrl
            ? `क्लाउड सर्व्हर अनुपलब्ध आणि ऑन-डिव्हाइस विश्लेषण अयशस्वी: ${localErr.message}`
            : `ऑन-डिव्हाइस विश्लेषण अयशस्वी: ${localErr.message}`
        );
      }
    }

    setLoading(false);
  };

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-400">लोड होत आहे...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* ───── Top Bar ───── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
                MANDIMITRA
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <span>/</span>
              <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                <Microscope className="w-4 h-4 text-emerald-500" />
                पीक रोग विश्लेषण
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/farmer"
            className="text-sm text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">डॅशबोर्डवर परत</span>
            <span className="sm:hidden">परत</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ───── Hero ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            AI-आधारित • ९३.५% अचूकता
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
            पीक रोग <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">ओळख</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base">
            तुमच्या पिकाच्या पानाचा फोटो अपलोड करा आणि आमचे AI रोग ओळखेल, कारण सांगेल
            आणि उपचार सुचवेल — काही सेकंदांत.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ───── LEFT: Upload Panel (3 cols) ───── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 space-y-6"
          >
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
              {/* Upload Area */}
              <div className="p-6 sm:p-8">
                {!preview ? (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center w-full h-72 sm:h-80 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                      dragOver
                        ? 'border-emerald-400 bg-emerald-50 scale-[1.01]'
                        : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                    }`}
                  >
                    <motion.div
                      animate={dragOver ? { scale: 1.1 } : { scale: 1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                        <ImagePlus className="w-9 h-9 text-emerald-500" />
                      </div>
                      <p className="text-base font-semibold text-slate-700 mb-1">
                        {dragOver ? 'तुमची इमेज इथे सोडा' : 'पिकाच्या पानाची इमेज अपलोड करा'}
                      </p>
                      <p className="text-sm text-slate-400 mb-4">ड्रॅग आणि ड्रॉप करा किंवा ब्राउझ करा</p>
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors">
                        <Upload className="w-4 h-4" />
                        फाइल निवडा
                      </div>
                      <p className="text-xs text-slate-300 mt-3">JPG, PNG • कमाल 10MB</p>
                    </motion.div>
                    <input type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
                  </label>
                ) : (
                  <div className="relative group">
                    <img
                      src={preview}
                      alt="पीक पूर्वावलोकन"
                      className="w-full h-72 sm:h-80 object-cover rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-2xl transition-colors" />
                    <button
                      onClick={resetAll}
                      className="absolute top-3 right-3 w-9 h-9 bg-white/95 backdrop-blur rounded-xl flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-600" />
                    </button>
                    {file && (
                      <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-white/95 backdrop-blur rounded-lg text-xs font-medium text-slate-600 shadow-lg">
                        📷 {file.name.length > 25 ? file.name.slice(0, 22) + '...' : file.name}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Analyze Button */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={!file || loading}
                    className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-green-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        विश्लेषण होत आहे...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        पीक विश्लेषण करा
                      </>
                    )}
                  </button>
                  {result && (
                    <button
                      onClick={resetAll}
                      className="px-4 py-3.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span className="hidden sm:inline">नवीन स्कॅन</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ───── RIGHT: Sidebar (2 cols) ───── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-5"
          >
            {/* Supported Crops Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-500" />
                समर्थित पिके
              </h3>
              <div className="space-y-3">
                {SUPPORTED_CROPS.map((crop) => (
                  <div key={crop.name} className="group">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 transition-colors">
                      <span className="text-2xl">{crop.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{crop.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {crop.diseases.join(' • ')}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {crop.diseases.length + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Info Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-green-500 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 opacity-90">
                <Info className="w-4 h-4" />
                आमच्या AI बद्दल
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-2xl font-extrabold">93.5%</p>
                  <p className="text-xs opacity-75">अचूकता</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-2xl font-extrabold">13.3K</p>
                  <p className="text-xs opacity-75">प्रशिक्षण इमेजेस</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-2xl font-extrabold">17</p>
                  <p className="text-xs opacity-75">रोग वर्ग</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-2xl font-extrabold">5</p>
                  <p className="text-xs opacity-75">पीक प्रकार</p>
                </div>
              </div>
              <p className="text-xs opacity-75 leading-relaxed">
                MobileNetV2 डीप लर्निंग आणि Google Gemini AI द्वारे बुद्धिमान उपचार शिफारसींसाठी संचालित.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ═══════════ RESULTS SECTION ═══════════ */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mt-10 space-y-6"
            >
              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Microscope className="w-4 h-4" />
                  विश्लेषण निकाल
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Status Card */}
              <div className={`rounded-3xl border shadow-sm overflow-hidden ${
                result.is_healthy
                  ? 'border-emerald-200'
                  : 'border-red-200'
              }`}>
                <div className={`p-6 sm:p-8 ${
                  result.is_healthy
                    ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50'
                    : 'bg-gradient-to-r from-red-50 via-orange-50 to-red-50'
                }`}>
                  <div className="flex items-start gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                      result.is_healthy ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      {result.is_healthy
                        ? <ShieldCheck className="w-8 h-8 text-emerald-600" />
                        : <Bug className="w-8 h-8 text-red-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h2 className={`text-2xl font-extrabold ${result.is_healthy ? 'text-emerald-800' : 'text-red-800'}`}>
                          {result.is_healthy ? 'पीक निरोगी आहे! 🎉' : result.advice.disease_name || result.disease}
                        </h2>
                        {!result.is_healthy && result.advice.severity && (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            result.advice.severity === 'severe'
                              ? 'bg-red-200 text-red-800'
                              : result.advice.severity === 'moderate'
                              ? 'bg-amber-200 text-amber-800'
                              : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {result.advice.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-base font-medium text-slate-700 mb-2">
                        {result.crop} • <span className="font-bold">{result.confidence}%</span> विश्वासनीयता
                        {inferenceMode && (
                          <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inferenceMode === 'cloud'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {inferenceMode === 'cloud' ? '☁️ क्लाउड AI' : '📱 ऑन-डिव्हाइस'}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">{result.advice.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="px-6 sm:px-8 py-5 bg-white border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">अंदाज विश्वासनीयता</h3>
                  <div className="space-y-3">
                    {result.top_predictions.map((pred, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className={`text-[11px] font-bold w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          i === 0
                            ? (result.is_healthy ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')
                            : 'bg-slate-100 text-slate-400'
                        }`}>{i + 1}</span>
                        <span className="text-sm text-slate-700 flex-1 truncate font-medium">
                          {pred.class.replace(/___/g, ' → ').replace(/_/g, ' ')}
                        </span>
                        <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pred.confidence}%` }}
                            transition={{ duration: 0.8, delay: i * 0.15 }}
                            className={`h-full rounded-full ${
                              i === 0
                                ? (result.is_healthy ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-red-400 to-orange-500') 
                                : 'bg-slate-300'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-500 w-14 text-right">{pred.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed AI Analysis */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors"
                >
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    AI-आधारित सविस्तर विश्लेषण
                  </h3>
                  <motion.div animate={{ rotate: showDetails ? 180 : 0 }}>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 space-y-5 border-t border-slate-100 pt-5">
                        {/* Description */}
                        <div className="bg-slate-50 rounded-2xl p-5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">वर्णन</h4>
                          <p className="text-sm text-slate-700 leading-relaxed">{result.advice.description}</p>
                        </div>

                        {/* Causes */}
                        {result.advice.causes && (
                          <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                            <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-2">मूळ कारणे</h4>
                            <p className="text-sm text-slate-700 leading-relaxed">{result.advice.causes}</p>
                          </div>
                        )}

                        {/* Symptoms */}
                        {result.advice.symptoms && result.advice.symptoms.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">लक्षात ठेवण्यासारखी लक्षणे</h4>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {result.advice.symptoms.map((s, i) => (
                                <div key={i} className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-100">
                                  <span className="w-2 h-2 mt-1.5 bg-red-400 rounded-full flex-shrink-0" />
                                  <span className="text-sm text-slate-700">{s}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Treatment */}
                        {result.advice.treatment && result.advice.treatment.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">उपचार योजना</h4>
                            <div className="space-y-3">
                              {result.advice.treatment.map((t, i) => (
                                <div key={i} className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                                  <div className="flex items-center gap-2.5 mb-2">
                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                                      t.method === 'Chemical' ? 'bg-purple-200 text-purple-800'
                                      : t.method === 'Organic' ? 'bg-green-200 text-green-800'
                                      : 'bg-blue-200 text-blue-800'
                                    }`}>{t.method}</span>
                                    <span className="text-sm font-bold text-slate-800">{t.name}</span>
                                  </div>
                                  <p className="text-sm text-slate-600 leading-relaxed">{t.details}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Preventive Tips */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">प्रतिबंधात्मक उपाय</h4>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {result.advice.preventive_tips.map((tip, i) => (
                              <div key={i} className="flex items-start gap-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                                <span className="text-sm text-slate-700">{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recommended Actions */}
                        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                          <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            शिफारस केलेल्या कृती
                          </h4>
                          <div className="space-y-2">
                            {result.advice.recommended_actions.map((a, i) => (
                              <div key={i} className="flex items-start gap-3 text-sm text-amber-900">
                                <span className="w-6 h-6 bg-amber-200 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-800">
                                  {i + 1}
                                </span>
                                <span className="font-medium pt-0.5">{a}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ─── Medicine / Pesticide KB Section ─── */}
              {result.treatment?.medicines?.treatments && result.treatment.medicines.treatments.length > 0 && (
                <div className="bg-white rounded-3xl border border-purple-200 shadow-sm overflow-hidden">
                  <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                    <h3 className="text-base font-bold text-purple-800 flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        💊
                      </div>
                      औषधे आणि बुरशीनाशके / Medicines & Fungicides
                    </h3>
                    {result.treatment.summary_mr && (
                      <p className="text-sm text-purple-700 mt-2 leading-relaxed">{result.treatment.summary_mr}</p>
                    )}
                  </div>
                  <div className="p-6 sm:p-8 space-y-4">
                    {result.treatment.medicines.treatments.map((med, i) => (
                      <div key={i} className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-purple-900">{med.name_mr || med.name}</span>
                          <span className="px-2 py-0.5 bg-purple-200 text-purple-800 rounded-lg text-[10px] font-bold uppercase">{med.type}</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-3 border border-purple-100">
                            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wide mb-1">मात्रा (Dosage)</p>
                            <p className="text-sm font-medium text-slate-800">{med.dosage_mr || med.dosage}</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-purple-100">
                            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wide mb-1">कसे वापरावे</p>
                            <p className="text-sm text-slate-700">{med.application_mr || med.application}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {result.treatment.medicines.prevention_mr && result.treatment.medicines.prevention_mr.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xs font-bold text-purple-500 uppercase tracking-wide mb-3">प्रतिबंधात्मक उपाय</h4>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {result.treatment.medicines.prevention_mr.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-3 bg-purple-50 rounded-xl border border-purple-100">
                              <CheckCircle className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                              <span className="text-sm text-slate-700">{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Soil Mineral Deficiency KB Section ─── */}
              {result.treatment?.soil_minerals?.deficiencies && result.treatment.soil_minerals.deficiencies.length > 0 && (
                <div className="bg-white rounded-3xl border border-amber-200 shadow-sm overflow-hidden">
                  <div className="p-6 sm:p-8 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
                    <h3 className="text-base font-bold text-amber-800 flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        🧪
                      </div>
                      मातीतील खनिज कमतरता / Soil Mineral Deficiencies
                    </h3>
                  </div>
                  <div className="p-6 sm:p-8 space-y-4">
                    {result.treatment.soil_minerals.deficiencies.map((def, i) => (
                      <div key={i} className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded-lg text-xs font-bold">{def.mineral_mr || def.mineral}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-white rounded-xl p-3 border border-amber-100">
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-1">रोगाशी संबंध</p>
                            <p className="text-sm text-slate-700">{def.relation_mr || def.relation}</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-amber-100">
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-1">उपाय</p>
                            <p className="text-sm font-medium text-slate-800">{def.remedy_mr || def.remedy}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {result.treatment.soil_minerals.general_advice_mr && (
                      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mt-3">
                        <p className="text-sm text-amber-900 font-medium leading-relaxed">{result.treatment.soil_minerals.general_advice_mr}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
