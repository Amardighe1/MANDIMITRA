'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'राजेश पाटील',
    role: 'सोयाबीन शेतकरी, पुणे',
    avatar: '👨‍🌾',
    content: 'मंडीमित्रमुळे मला सोयाबीन केव्हा विकायचा हे समजले. भाव अंदाज अचूक होता आणि मला गेल्या वर्षीपेक्षा ₹15,000 जास्त मिळाले!',
    rating: 5,
  },
  {
    name: 'सुनीता देशमुख',
    role: 'कापूस शेतकरी, नाशिक',
    avatar: '👩‍🌾',
    content: 'पीक जोखीम सूचनेमुळे माझा कापूस पीक कीटकांच्या नुकसानीपासून वाचला. समस्या पसरण्याच्या 3 दिवस आधी मला इशारा मिळाला.',
    rating: 5,
  },
  {
    name: 'मनोज जाधव',
    role: 'कांदा शेतकरी, अहमदनगर',
    avatar: '👨‍🌾',
    content: 'माझ्यासारख्या ज्याला तंत्रज्ञान फारसे कळत नाही त्यांनाही वापरण्यास सोपे. मराठी भाषेची सोय खूप मदत करते.',
    rating: 5,
  },
  {
    name: 'प्रिया कुलकर्णी',
    role: 'गहू शेतकरी, सोलापूर',
    avatar: '👩‍🌾',
    content: 'बाजार तुलना वैशिष्ट्यामुळे मला प्रति क्विंटल ₹200 जास्त मिळाला असा बाजार सापडला. वाहतूक खर्चाचा हिशोब खूप अचूक होता.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            अनुभव
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            शेतकऱ्यांना आवडले
            <br />
            <span className="text-gradient">संपूर्ण महाराष्ट्रात</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            शेतकरी मंडीमित्रबद्दल काय म्हणतात ते पाहा
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-shadow"
            >
              {/* Quote Icon */}
              <Quote className="w-10 h-10 text-emerald-200 mb-4" />

              {/* Content */}
              <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center">
                <div className="text-4xl mr-4">{testimonial.avatar}</div>
                <div>
                  <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
