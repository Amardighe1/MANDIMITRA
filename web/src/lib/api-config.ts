/**
 * API Base URL utility for MANDIMITRA.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_API_URL env var (baked in at build time)
 *  2. Capacitor APK: localStorage override or EC2 direct URL
 *  3. Vercel / dev: empty string (relative URLs proxied by Vercel rewrites)
 */

const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// EC2 backend URL — used ONLY by Capacitor APK (direct HTTP, no mixed content issue)
const EC2_API_URL = 'http://56.228.42.84:8000';

function resolveApiBase(): string {
  // 1) Build-time env var
  if (ENV_API_URL) return ENV_API_URL.replace(/\/+$/, '');

  // 2) Capacitor APK — call EC2 directly (APK is not HTTPS, so no mixed content)
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const override = localStorage.getItem('mandimitra_api_url');
    if (override) return override.replace(/\/+$/, '');
    return EC2_API_URL;
  }

  // 3) Vercel & localhost dev: relative URLs — Vercel rewrites proxy /api/* to EC2
  return '';
}

/**
 * Build full API path. Re-resolves base on every call.
 */
export function apiUrl(path: string): string {
  const base = resolveApiBase();
  return `${base}${path}`;
}
