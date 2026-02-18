'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, X, ExternalLink, Loader2 } from 'lucide-react';

// Leaflet is imported dynamically to avoid SSR issues
let L: typeof import('leaflet') | null = null;

interface FarmerLocationMapProps {
  farmerLat: number;
  farmerLon: number;
  farmerName: string;
  animalType: string;
  onClose: () => void;
}

export default function FarmerLocationMap({
  farmerLat,
  farmerLon,
  farmerName,
  animalType,
  onClose,
}: FarmerLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [doctorCoords, setDoctorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Load Leaflet dynamically (client-side only)
  useEffect(() => {
    let cancelled = false;

    async function loadLeaflet() {
      if (!L) {
        const leaflet = await import('leaflet');
        L = leaflet.default || leaflet;

        // Fix default icon paths for webpack/Next.js
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      }
      if (!cancelled) setMapReady(true);
    }

    // Inject Leaflet CSS if not already present
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    loadLeaflet();
    return () => { cancelled = true; };
  }, []);

  // Initialize map once Leaflet is loaded
  useEffect(() => {
    if (!mapReady || !mapRef.current || !L) return;

    // Avoid re-init
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [farmerLat, farmerLon],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Farmer marker (red)
    const farmerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background: #dc2626;
        width: 36px; height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 16px;">🚨</span>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    L.marker([farmerLat, farmerLon], { icon: farmerIcon })
      .addTo(map)
      .bindPopup(
        `<div style="text-align:center; font-family:system-ui;">
          <b style="font-size:14px;">📍 ${farmerName}</b><br/>
          <span style="color:#666; font-size:12px;">${animalType} Emergency</span><br/>
          <span style="color:#999; font-size:11px;">${farmerLat.toFixed(5)}, ${farmerLon.toFixed(5)}</span>
        </div>`
      )
      .openPopup();

    mapInstanceRef.current = map;

    // Force resize after modal animation
    setTimeout(() => map.invalidateSize(), 300);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapReady, farmerLat, farmerLon, farmerName, animalType]);

  // Add doctor marker when location is obtained
  useEffect(() => {
    if (!doctorCoords || !mapInstanceRef.current || !L) return;

    const map = mapInstanceRef.current;

    const doctorIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background: #2563eb;
        width: 36px; height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 16px;">🩺</span>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    L.marker([doctorCoords.lat, doctorCoords.lng], { icon: doctorIcon })
      .addTo(map)
      .bindPopup('<b>📍 Your Location</b>');

    // Draw line between doctor and farmer
    const line = L.polyline(
      [[doctorCoords.lat, doctorCoords.lng], [farmerLat, farmerLon]],
      { color: '#f59e0b', weight: 3, dashArray: '8, 8', opacity: 0.8 }
    ).addTo(map);

    // Fit bounds to show both markers
    const bounds = L.latLngBounds(
      [doctorCoords.lat, doctorCoords.lng],
      [farmerLat, farmerLon]
    );
    map.fitBounds(bounds, { padding: [60, 60] });

  }, [doctorCoords, farmerLat, farmerLon]);

  const handleGetMyLocation = () => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDoctorCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingLocation(false);
      },
      () => setGettingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const openGoogleMapsDirections = () => {
    // If we have doctor coords, use them as origin; otherwise let Google auto-detect
    const origin = doctorCoords
      ? `${doctorCoords.lat},${doctorCoords.lng}`
      : 'current+location';
    const destination = `${farmerLat},${farmerLon}`;
    const url = `https://www.google.com/maps/dir/${origin}/${destination}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Farmer Location</h3>
              <p className="text-sm text-slate-500">
                {farmerName} • {animalType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Map */}
        <div
          ref={mapRef}
          className="w-full h-[350px] bg-slate-100"
          style={{ minHeight: 350 }}
        >
          {!mapReady && (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGetMyLocation}
            disabled={gettingLocation || !!doctorCoords}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium disabled:opacity-50 text-sm flex-1"
          >
            {gettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : doctorCoords ? (
              <>
                <MapPin className="w-4 h-4 text-blue-600" />
                My Location Added
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Show My Location
              </>
            )}
          </button>

          <button
            onClick={openGoogleMapsDirections}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm flex-1 shadow-lg shadow-blue-600/25"
          >
            <Navigation className="w-4 h-4" />
            Navigate in Google Maps
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>

        {/* Coordinates info */}
        <div className="px-5 pb-4 text-xs text-slate-400 flex flex-wrap gap-x-6 gap-y-1">
          <span>🚨 Farmer: {farmerLat.toFixed(5)}, {farmerLon.toFixed(5)}</span>
          {doctorCoords && (
            <span>🩺 You: {doctorCoords.lat.toFixed(5)}, {doctorCoords.lng.toFixed(5)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
