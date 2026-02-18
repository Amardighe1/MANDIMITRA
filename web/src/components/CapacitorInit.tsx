'use client';

import { useEffect } from 'react';

/**
 * Detects Capacitor native platform and adds the `capacitor-app` class to body.
 * This enables the 0.5cm top/bottom safe area padding defined in globals.css.
 */
export function CapacitorInit() {
  useEffect(() => {
    // Capacitor injects window.Capacitor when running inside native shell
    const isCapacitor =
      typeof window !== 'undefined' &&
      (window as any).Capacitor?.isNativePlatform?.() === true;

    if (isCapacitor) {
      document.body.classList.add('capacitor-app');

      // Set status bar style if StatusBar plugin is available
      import('@capacitor/status-bar')
        .then(({ StatusBar, Style }) => {
          StatusBar.setStyle({ style: Style.Dark });
          StatusBar.setBackgroundColor({ color: '#000000' });
        })
        .catch(() => {
          // StatusBar plugin not installed — skip
        });
    }
  }, []);

  return null;
}
