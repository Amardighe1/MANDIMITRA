'use client';

import { useEffect } from 'react';

/**
 * Detects Capacitor native platform and configures the status bar.
 *
 * Key behavior: StatusBar.setOverlaysWebView(false)
 * This tells Android to give the system status bar (notifications, clock, battery)
 * its own dedicated space — the WebView starts BELOW it, exactly like native apps.
 * No CSS padding hacks are needed.
 */
export function CapacitorInit() {
  useEffect(() => {
    const isCapacitor =
      typeof window !== 'undefined' &&
      (window as any).Capacitor?.isNativePlatform?.() === true;

    if (isCapacitor) {
      document.body.classList.add('capacitor-app');

      // Configure status bar: non-overlapping, black background
      import('@capacitor/status-bar')
        .then(({ StatusBar, Style }) => {
          // This is the critical call — makes the status bar NOT overlay the WebView
          StatusBar.setOverlaysWebView({ overlay: false });
          StatusBar.setStyle({ style: Style.Light });  // dark icons on light bg
          StatusBar.setBackgroundColor({ color: '#FFFFFF' });  // white status bar
        })
        .catch(() => {
          // StatusBar plugin not installed — skip
        });
    }
  }, []);

  return null;
}
