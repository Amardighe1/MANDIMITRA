'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api-config';

/**
 * ConnectionSetup — Checks whether the FastAPI backend is reachable.
 *
 * In a Capacitor static-export build, relative API URLs resolve to local HTML
 * files (not the backend). This component:
 *  1. Pings the /health endpoint
 *  2. Validates the response is actually JSON (not an HTML page)
 *  3. If unreachable OR returns HTML → shows a prompt for the server URL
 *
 * Works on both emulator and real devices regardless of Capacitor detection.
 */
export function ConnectionSetup() {
  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://');
  const [testError, setTestError] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // If a server URL is already saved in localStorage, pre-fill it
    const saved = localStorage.getItem('mandimitra_api_url');
    if (saved) setServerUrl(saved);

    // Always verify the backend is reachable — don't rely on Capacitor detection
    const healthUrl = apiUrl('/health');

    // Ping the /health endpoint (proxied through Vercel rewrites on web).
    fetch(healthUrl, { method: 'GET', signal: AbortSignal.timeout(5000) })
      .then(async (r) => {
        const ct = r.headers.get('content-type') || '';
        if (r.ok && ct.includes('application/json')) {
          // Backend is reachable and returning JSON — all good
          setConnected(true);
        } else {
          // Got HTML or error status — backend not reachable
          setShowSetup(true);
        }
      })
      .catch(() => {
        setShowSetup(true);
      })
      .finally(() => setChecking(false));
  }, []);

  const handleTestAndSave = async () => {
    setTesting(true);
    setTestError('');
    const url = serverUrl.replace(/\/+$/, '');

    if (!url || url === 'http://' || url === 'https://') {
      setTestError('Please enter a valid server URL (e.g. http://192.168.1.100:8000)');
      setTesting(false);
      return;
    }

    try {
      const r = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const ct = r.headers.get('content-type') || '';
      if (!r.ok || !ct.includes('application/json')) {
        throw new Error(`Server returned non-JSON response (status ${r.status})`);
      }
      // Save to localStorage — apiUrl() picks this up on every call
      localStorage.setItem('mandimitra_api_url', url);
      setConnected(true);
      setShowSetup(false);
      // Reload so all components pick up the new base URL
      window.location.reload();
    } catch (e: any) {
      setTestError(
        `Cannot reach server at ${url}\n\n` +
          'Make sure:\n' +
          '• The API server is running\n' +
          '  python -m uvicorn api.main:app --host 0.0.0.0\n' +
          '• Your phone is on the same WiFi as the server\n' +
          '• You entered the correct IP and port (usually 8000)'
      );
    } finally {
      setTesting(false);
    }
  };

  // While checking, don't render anything (fast — <5s)
  if (checking) return null;
  // Backend is confirmed reachable
  if (connected) return null;
  // No setup needed
  if (!showSetup) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Connect to Server</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter the IP address of the MANDIMITRA API server running on your computer.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Server URL
          </label>
          <input
            type="url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://192.168.1.100:8000"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            autoCapitalize="off"
            autoCorrect="off"
          />
          <p className="text-xs text-slate-400 mt-1">
            Find your PC&apos;s IP: run <code className="bg-slate-100 px-1 rounded">ipconfig</code> on Windows
          </p>
        </div>

        {testError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-700 whitespace-pre-line">{testError}</p>
          </div>
        )}

        <button
          onClick={handleTestAndSave}
          disabled={testing || !serverUrl || serverUrl === 'http://' || serverUrl === 'https://'}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          {testing ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Testing connection...
            </>
          ) : (
            'Connect'
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          Start server: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">python -m uvicorn api.main:app --host 0.0.0.0</code>
        </p>
      </div>
    </div>
  );
}
