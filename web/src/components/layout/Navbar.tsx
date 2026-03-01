'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Menu, 
  X, 
  Leaf,
  ChevronDown,
  BarChart3,
  Shield,
  Cloud,
  TrendingUp,
  LogOut,
  User,
  LayoutDashboard,
  Stethoscope,
  Camera,
  ShoppingCart,
} from 'lucide-react';

interface NavbarProps {
  isScrolled: boolean;
}

const navLinks = [
  { name: 'वैशिष्ट्ये', href: '#features' },
  { name: 'कसे काम करते', href: '#how-it-works' },
];

const productLinks = [
  { name: 'पीक जोखीम सल्लागार', href: '/crop-risk', icon: Shield, description: 'AI-आधारित पीक जोखीम मूल्यांकन' },
  { name: 'भाव अंदाज', href: '/price-forecast', icon: TrendingUp, description: '15-दिवसांचा भाव अंदाज' },
  { name: 'हवामान माहिती', href: '/weather', icon: Cloud, description: 'स्थानिक हवामान अंदाज' },
  { name: 'बाजार विश्लेषण', href: '/markets', icon: BarChart3, description: 'रिअल-टाइम बाजार माहिती' },
];

export function Navbar({ isScrolled }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const roleBadge = user ? {
    farmer: 'bg-emerald-100 text-emerald-700',
    doctor: 'bg-blue-100 text-blue-700',
    admin: 'bg-amber-100 text-amber-700',
    buyer: 'bg-purple-100 text-purple-700',
  }[user.role] || 'bg-slate-100 text-slate-700' : '';

  const dashboardPath = user
    ? user.role === 'farmer' ? '/' : `/dashboard/${user.role}`
    : '/login';

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => document.body.classList.remove('menu-open');
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/50' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
              </div>
              <span className="text-xl font-bold text-gradient">MANDIMITRA</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* Products Dropdown */}
              <div className="relative group">
                <button
                  onMouseEnter={() => setIsProductMenuOpen(true)}
                  onMouseLeave={() => setIsProductMenuOpen(false)}
                  className="flex items-center px-4 py-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                >
                  उत्पादने
                  <ChevronDown className={`ml-1 w-4 h-4 transition-transform ${isProductMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isProductMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onMouseEnter={() => setIsProductMenuOpen(true)}
                      onMouseLeave={() => setIsProductMenuOpen(false)}
                      className="absolute top-full left-0 w-80 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-2 mt-2"
                    >
                      {productLinks.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-start p-3 rounded-xl hover:bg-emerald-50 transition-colors group"
                        >
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-emerald-200 transition-colors">
                            <item.icon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{item.name}</div>
                            <div className="text-sm text-slate-500">{item.description}</div>
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              {user ? (
                <>
                  {user.role === 'farmer' ? (
                    <>
                      <Link
                        href="/crop-analysis"
                        className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        Crop Analysis
                      </Link>
                      <Link
                        href="/veterinary"
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        <Stethoscope className="w-4 h-4" />
                        पशुवैद्यकीय सेवा
                      </Link>
                      <Link
                        href="/mandi"
                        className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        मंडी विक्री
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={dashboardPath}
                      className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      डॅशबोर्ड
                    </Link>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">{user.full_name || user.email}</span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${roleBadge}`}>
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="लॉग आउट"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                  >
                    लॉग इन
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
                  >
                    मोफत सुरू करा
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 -mr-2 rounded-xl hover:bg-slate-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-600" />
              ) : (
                <Menu className="w-6 h-6 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto no-scrollbar"
            >
              <div className="p-6 pb-10 space-y-6" style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gradient">मंडीमित्र</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-600" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">उत्पादने</div>
                  {productLinks.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center p-3 rounded-xl hover:bg-emerald-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                        <item.icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{item.name}</div>
                        <div className="text-sm text-slate-500">{item.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>

                <div className="space-y-3 pt-4">
                  {user ? (
                    <>
                      {user.role === 'farmer' ? (
                        <>
                          <Link
                            href="/crop-analysis"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                          >
                            <Camera className="w-4 h-4" />
                            पीक विश्लेषण
                          </Link>
                          <Link
                            href="/veterinary"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                          >
                            <Stethoscope className="w-4 h-4" />
                            पशुवैद्यकीय सेवा
                          </Link>
                          <Link
                            href="/mandi"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            मंडी विक्री
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={dashboardPath}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          डॅशबोर्ड वर जा
                        </Link>
                      )}
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                        <User className="w-5 h-5 text-slate-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{user.full_name || user.email}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${roleBadge}`}>
                          {user.role}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 text-red-600 font-medium border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        लॉग आउट
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block w-full px-4 py-3 text-center text-slate-600 font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        लॉग इन
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block w-full px-4 py-3 text-center bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/30"
                      >
                        मोफत सुरू करा
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
