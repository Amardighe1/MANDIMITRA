/**
 * API Base URL utility for MANDIMITRA.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_API_URL env var (baked in at build time)
 *  2. Capacitor runtime: checks localStorage('mandimitra_api_url') for user override
 *  3. Fallback '' (relative URLs – works with Next.js dev proxy)
 *
 * NOTE for mobile APK builds:
 *  Set NEXT_PUBLIC_API_URL to your backend's LAN IP or public URL:
 *    NEXT_PUBLIC_API_URL=http://192.168.1.100:8000  npm run build:mobile
 *  Or let the in-app ConnectionSetup prompt handle it at runtime.
 */

const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Cloud backend URL (Render deployment) — used as default for Capacitor builds
const CLOUD_API_URL = 'https://mandimitra-58ni.onrender.com';

function resolveApiBase(): string {
  // 1) Runtime override stored in localStorage (for Capacitor / real devices)
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('mandimitra_api_url');
    if (override) return override.replace(/\/+$/, '');
  }

  // 2) Build-time env var
  if (ENV_API_URL) return ENV_API_URL.replace(/\/+$/, '');

  // 3) In Capacitor (static export), use cloud backend
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    return CLOUD_API_URL;
  }

  // 4) Relative URLs (works in Next.js dev mode with proxy rewrites)
  return '';
}

// Export as getter so it re-evaluates on each access (picks up localStorage changes)
export const API_BASE = resolveApiBase();

/**
 * Build full API path. Prepends API_BASE when running in Capacitor/static mode.
 * Re-resolves on every call so it picks up runtime config changes.
 */
export function apiUrl(path: string): string {
  const base = resolveApiBase();
  return `${base}${path}`;
}
