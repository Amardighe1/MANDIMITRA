'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Camera,
  ShoppingCart,
  Stethoscope,
  User,
} from 'lucide-react';

const farmerTabs = [
  { label: 'होम', icon: Home, href: '/' },
  { label: 'पीक तपासा', icon: Camera, href: '/crop-analysis' },
  { label: 'मंडी', icon: ShoppingCart, href: '/mandi' },
  { label: 'डॉक्टर', icon: Stethoscope, href: '/veterinary' },
  { label: 'प्रोफाइल', icon: User, href: '/dashboard/farmer' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Only show for logged-in farmers
  if (!user || user.role !== 'farmer') return null;

  // Don't show on login/signup pages
  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 pt-1.5">
        {farmerTabs.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 min-w-[56px] rounded-lg transition-colors ${
                isActive
                  ? 'text-emerald-600'
                  : 'text-slate-400 active:text-slate-600'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
