'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Play, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const benefits = [
  'AI-आधारित पीक जोखीम मूल्यांकन',
  '15-दिवसांचा भाव अंदाज',
  'रिअल-टाइम बाजार माहिती',
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
      
      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 left-20 hidden lg:block"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl rotate-12 shadow-2xl shadow-emerald-500/30" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-32 right-32 hidden lg:block"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl -rotate-12 shadow-2xl shadow-amber-500/30" />
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              अत्याधुनिक AI आणि ML द्वारे संचालित
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              हुशार शेती,
              <br />
              <span className="text-gradient">हुशार निर्णय</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-lg mx-auto lg:mx-0">
              मंडीमित्र भारतीय शेतकऱ्यांना AI-आधारित पीक जोखीम मूल्यांकन आणि 
              भाव बुद्धिमत्तेद्वारे नफा वाढवण्यास आणि नुकसान कमी करण्यास मदत करतो.
            </p>

            {/* Benefits */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8 justify-center lg:justify-start">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center text-slate-600"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
                  <span className="text-sm font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/crop-risk"
                className="group inline-flex items-center justify-center px-6 sm:px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 w-full sm:w-auto"
              >
                पीक जोखीम सल्लागार वापरा
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/price-forecast"
                className="group inline-flex items-center justify-center px-6 sm:px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all hover:scale-105 w-full sm:w-auto"
              >
                <Play className="mr-2 w-5 h-5 text-emerald-500" />
                भाव अंदाज पाहा
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 pt-8 border-t border-slate-200"
            >
              <p className="text-sm text-slate-500 mb-4">महाराष्ट्रभरातील शेतकऱ्यांचा विश्वास</p>
              <div className="flex flex-nowrap gap-4 sm:gap-6 items-center justify-center lg:justify-start overflow-x-auto no-scrollbar pb-2">
                <div className="text-center flex-shrink-0">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900">35 लाख+</div>
                  <div className="text-xs text-slate-500">भाव नोंदी</div>
                </div>
                <div className="w-px h-8 sm:h-10 bg-slate-200 flex-shrink-0" />
                <div className="text-center flex-shrink-0">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900">400+</div>
                  <div className="text-xs text-slate-500">बाजार</div>
                </div>
                <div className="w-px h-8 sm:h-10 bg-slate-200 flex-shrink-0" />
                <div className="text-center flex-shrink-0">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900">93%</div>
                  <div className="text-xs text-slate-500">अचूकता</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-6 border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">पीक जोखीम मूल्यांकन</h3>
                    <p className="text-sm text-slate-500">सोयाबीन - पुणे जिल्हा</p>
                  </div>
                  <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                    मध्यम जोखीम
                  </div>
                </div>

                {/* Risk Meter */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">जोखीम पातळी</span>
                    <span className="font-semibold text-slate-900">45/100</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[45%] bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 rounded-full" />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-emerald-50 rounded-xl">
                    <div className="text-2xl font-bold text-emerald-600">87%</div>
                    <div className="text-xs text-slate-500">कमी जोखीम</div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-xl">
                    <div className="text-2xl font-bold text-amber-600">10%</div>
                    <div className="text-xs text-slate-500">मध्यम</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-xl">
                    <div className="text-2xl font-bold text-red-600">3%</div>
                    <div className="text-xs text-slate-500">जास्त जोखीम</div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-2">
                  <div className="flex items-center p-3 bg-slate-50 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3" />
                    <span className="text-sm text-slate-600">मातीतील ओलावाची पातळी तपासा</span>
                  </div>
                  <div className="flex items-center p-3 bg-slate-50 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3" />
                    <span className="text-sm text-slate-600">3 दिवसांत पाऊस अपेक्षित</span>
                  </div>
                </div>
              </div>

              {/* Floating Price Card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-slate-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">₹</span>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">7-दिवसांचा अंदाज</div>
                    <div className="flex items-center">
                      <span className="text-xl font-bold text-slate-900">₹4,850</span>
                      <span className="ml-2 text-sm text-emerald-500 font-medium">+5.2%</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Weather Card */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-slate-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">🌤️</div>
                  <div>
                    <div className="text-sm text-slate-500">Pune</div>
                    <div className="text-xl font-bold text-slate-900">28°C</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
