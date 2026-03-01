'use client';

import { motion } from 'framer-motion';
import { Shield, TrendingUp, Cloud, BarChart3, Zap, Globe } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'पीक जोखीम मूल्यांकन',
    description: 'हवामान, वाढीचे टप्पे आणि ऐतिहासिक माहितीवर आधारित AI-आधारित जोखीम विश्लेषण. कीटक, रोग आणि प्रतिकूल हवामानाची आगाऊ सूचना मिळवा.',
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: TrendingUp,
    title: 'भाव बुद्धिमत्ता',
    description: '93% अचूकतेसह 15-दिवसांचा भाव अंदाज. विश्वासाने केव्हा धरा किंवा विका हे जाणून घ्या.',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Cloud,
    title: 'हवामान माहिती',
    description: 'पीक जीवनचक्राशी जोडलेले स्थानिक हवामान अंदाज. सिंचन आणि कापणीच्या शिफारसी मिळवा.',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    icon: BarChart3,
    title: 'बाजार तुलना',
    description: '400+ मंड्यांमध्ये रिअल-टाइम भावांची तुलना करा. वाहतूक खर्च लक्षात घेउन तुमच्या मालाला सर्वोत्तम बाजार शोधा.',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    icon: Zap,
    title: 'तात्काळ सूचना',
    description: 'भाव बदल, हवामान इशारा आणि जोखीम सूचना तुमच्या फोनवर तात्काळ मिळवा.',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Globe,
    title: 'बहुभाषिक समर्थन',
    description: 'मराठी, हिंदी आणि इंग्रजी मध्ये उपलब्ध. भारतीय शेतकऱ्यांसाठी स्थानिक संदर्भानुसार तयार केलेले.',
    color: 'teal',
    gradient: 'from-teal-500 to-teal-600',
  },
];

const colorClasses: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500',
  amber: 'bg-amber-100 text-amber-600 group-hover:bg-amber-500',
  blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-500',
  purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-500',
  pink: 'bg-pink-100 text-pink-600 group-hover:bg-pink-500',
  teal: 'bg-teal-100 text-teal-600 group-hover:bg-teal-500',
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            वैशिष्ट्ये
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            हुशार शेतीसाठी लागणारे
            <br />
            <span className="text-gradient">सर्व काही</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            भारतीय शेतकऱ्यांसाठी खास तयार केलेली संपूर्ण शेती बुद्धिमत्ता साधने, 
            अत्याधुनिक AI आणि रिअल-टाइम माहितीद्वारे संचालित.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${colorClasses[feature.color]} group-hover:text-white`}>
                <feature.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
