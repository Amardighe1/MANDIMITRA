'use client';

import { motion } from 'framer-motion';
import { Smartphone, Cloud, BarChart3, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Smartphone,
    title: 'तुमची माहिती भरा',
    description: 'तुमचा पीक, जिल्हा आणि पेरणीची तारीख सांगा. आमच्या AI ला फक्त थोड्या माहितीची गरज आहे.',
    color: 'emerald',
  },
  {
    number: '02',
    icon: Cloud,
    title: 'AI माहितीचे विश्लेषण करतो',
    description: 'आम्ही हवामान अंदाज, ऐतिहासिक नमुने आणि बाजार माहितीवर प्रगत मशीन लर्निंग मॉडेल्सनी प्रक्रिया करतो.',
    color: 'blue',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'हुशार माहिती मिळवा',
    description: 'पीक जोखीम मूल्यांकन, भाव अंदाज आणि कृतीयोग्य शिफारसी काही सेकंदात मिळवा.',
    color: 'amber',
  },
  {
    number: '04',
    icon: CheckCircle2,
    title: 'चांगले निर्णय घ्या',
    description: 'आमच्या माहितीचा वापर करून कापणीची वेळ ठरवा, सर्वोत्तम बाजार निवडा आणि नफा वाढवा.',
    color: 'purple',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            कसे काम करते
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            सोप्या पायऱ्यांमध्ये
            <br />
            <span className="text-gradient">हुशार शेती</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            काही मिनिटांत सुरू करा. कुठल्याही तंत्रज्ञानाची गरज नाही.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-200 via-blue-200 via-amber-200 to-purple-200 -translate-y-1/2" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl transition-shadow mt-4">
                  {/* Step Number */}
                  <div className="absolute -top-3 sm:-top-4 left-6 sm:left-8 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                    step.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                    step.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    step.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    <step.icon className="w-8 h-8" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-600">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
