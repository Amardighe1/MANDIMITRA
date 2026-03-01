'use client';

import Link from 'next/link';
import { Leaf, Twitter, Github, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  products: [
    { name: 'पीक जोखीम सल्लागार', href: '/crop-risk' },
    { name: 'भाव बुद्धिमत्ता', href: '/price-forecast' },
    { name: 'हवामान माहिती', href: '/weather' },
    { name: 'बाजार विश्लेषण', href: '/markets' },
  ],
  company: [
    { name: 'आमच्याबद्दल', href: '/about' },
    { name: 'नोकऱ्या', href: '/careers' },
    { name: 'ब्लॉग', href: '/blog' },
    { name: 'प्रेस किट', href: '/press' },
  ],
  resources: [
    { name: 'दस्तएवज', href: '/docs' },
    { name: 'API संदर्भ', href: '/api-docs' },
    { name: 'मदत केंद्र', href: '/help' },
    { name: 'समुदाय', href: '/community' },
  ],
  legal: [
    { name: 'गोपनीयता धोरण', href: '/privacy' },
    { name: 'सेवा अटी', href: '/terms' },
    { name: 'कुकी धोरण', href: '/cookies' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">MANDIMITRA</span>
            </Link>
            <p className="text-slate-400 mb-6 max-w-sm">
              भारतीय शेतकऱ्यांना AI-आधारित शेती बुद्धिमत्तेच्या माध्यमातून हुशार आणि 
              अधिक नफ्याच्या शेती निर्णयांसाठी सक्षम करणे.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold mb-4">उत्पादने</h3>
            <ul className="space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">कंपनी</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">साधने</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">संपर्क</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-emerald-500" />
                <a href="mailto:support@mandimitra.in" className="hover:text-emerald-400 transition-colors break-all sm:break-normal text-sm">
                  support@mandimitra.in
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-emerald-500" />
                <a href="tel:+911234567890" className="hover:text-emerald-400 transition-colors">
                  +91 123 456 7890
                </a>
              </li>
              <li className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-1 text-emerald-500" />
                <span>Pune, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-slate-500">
                            © 2026 मंडीमित्र. सर्व हक्क राखीव. भारतीय शेतकऱ्यांसाठी ❤️ने बनवले
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
