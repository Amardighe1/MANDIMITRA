'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Sunrise,
  Sunset,
  Eye,
  ChevronDown,
  Loader2,
  MapPin,
  Calendar,
  ArrowLeft,
  RefreshCw,
  CloudRain,
  Umbrella,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { apiUrl } from '@/lib/api-config';

interface CurrentWeather {
  temperature: number;
  feels_like: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  wind_direction: number;
  weather_code: number;
  weather_description: string;
  weather_emoji: string;
  is_day: boolean;
}

interface DayForecast {
  date: string;
  temp_max: number;
  temp_min: number;
  feels_like_max: number;
  feels_like_min: number;
  precipitation: number;
  precipitation_probability: number;
  wind_speed: number;
  humidity_max: number;
  humidity_min: number;
  uv_index: number;
  sunrise: string;
  sunset: string;
  weather_code: number;
  weather_description: string;
  weather_emoji: string;
}

interface WeatherData {
  district: string;
  latitude: number;
  longitude: number;
  current: CurrentWeather;
  forecast: DayForecast[];
  source: string;
  updated_at: string;
}

interface District {
  name: string;
  latitude: number;
  longitude: number;
}

const POPULAR_DISTRICTS = ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Aurangabad', 'Kolhapur', 'Solapur', 'Ahmednagar'];

function formatDate(dateStr: string): { day: string; date: string; month: string; full: string } {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    day: days[d.getDay()],
    date: d.getDate().toString(),
    month: months[d.getMonth()],
    full: d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '--:--';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getWindDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function getUVLabel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: 'कमी', color: 'text-green-400' };
  if (uv <= 5) return { label: 'मध्यम', color: 'text-yellow-400' };
  if (uv <= 7) return { label: 'जास्त', color: 'text-orange-400' };
  if (uv <= 10) return { label: 'अति जास्त', color: 'text-red-400' };
  return { label: 'अत्यंत', color: 'text-purple-400' };
}

function getTempColor(temp: number): string {
  if (temp <= 15) return 'text-blue-400';
  if (temp <= 25) return 'text-cyan-400';
  if (temp <= 33) return 'text-yellow-400';
  if (temp <= 40) return 'text-orange-400';
  return 'text-red-400';
}

export default function WeatherPage() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('Pune');
  const [forecastDays, setForecastDays] = useState<7 | 15>(7);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch districts list
  useEffect(() => {
    fetch(apiUrl('/api/weather/districts'))
      .then(r => r.json())
      .then(data => setDistricts(data.districts || []))
      .catch(() => {});
  }, []);

  // Fetch weather forecast
  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/weather/forecast?district=${encodeURIComponent(selectedDistrict)}&days=${forecastDays}`));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to fetch weather');
      }
      const data = await res.json();
      setWeather(data);
      setSelectedDay(0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDistrict, forecastDays]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const filteredDistricts = districts.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedForecast = weather?.forecast?.[selectedDay];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/farmer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white/60 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <CloudSun className="w-7 h-7 text-blue-400" />
                  हवामान माहिती
                </h1>
                <p className="text-white/50 text-sm">महाराष्ट्रासाठी स्थानिक हवामान अंदाज</p>
              </div>
            </div>
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 transition text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              रिफ्रेश करा
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* District Picker */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowDistrictPicker(!showDistrictPicker)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                {selectedDistrict}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDistrictPicker ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showDistrictPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 top-full mt-2 w-full bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                >
                  <div className="p-3 border-b border-white/10">
                    <input
                      type="text"
                      placeholder="जिल्हा शोधा..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                      autoFocus
                    />
                  </div>
                  {/* Popular districts */}
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">लोकप्रिय</p>
                    <div className="flex flex-wrap gap-1">
                      {POPULAR_DISTRICTS.map(d => (
                        <button
                          key={d}
                          onClick={() => { setSelectedDistrict(d); setShowDistrictPicker(false); setSearchQuery(''); }}
                          className={`px-2 py-1 rounded text-xs transition ${
                            selectedDistrict === d
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-2">
                    {filteredDistricts.map(d => (
                      <button
                        key={d.name}
                        onClick={() => { setSelectedDistrict(d.name); setShowDistrictPicker(false); setSearchQuery(''); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          selectedDistrict === d.name
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Forecast Days Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button
              onClick={() => setForecastDays(7)}
              className={`px-5 py-3 text-sm font-medium transition ${
                forecastDays === 7
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              ७ दिवस
            </button>
            <button
              onClick={() => setForecastDays(15)}
              className={`px-5 py-3 text-sm font-medium transition ${
                forecastDays === 15
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              १५ दिवस
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
            <p className="text-white/50">{selectedDistrict} साठी हवामान माहिती आणत आहे...</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && weather && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Current Weather Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main Current Card */}
              <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 p-6 sm:p-8">
                <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
                  <MapPin className="w-4 h-4" />
                  {weather.district}, Maharashtra
                  <span className="ml-auto text-xs">
                    Updated: {new Date(weather.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div>
                    <div className="text-7xl sm:text-8xl mb-1">{weather.current.weather_emoji}</div>
                    <p className="text-white/60 text-sm">{weather.current.weather_description}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-6xl sm:text-7xl font-light ${getTempColor(weather.current.temperature)}`}>
                        {Math.round(weather.current.temperature)}°
                      </span>
                      <span className="text-white/40 text-lg">C</span>
                    </div>
                    <p className="text-white/50 text-sm mt-1">
                      जाणवते {Math.round(weather.current.feels_like)}°C
                    </p>
                  </div>
                </div>

                {/* Current Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                  <div className="bg-white/5 rounded-xl p-3">
                    <Droplets className="w-4 h-4 text-blue-400 mb-1" />
                    <p className="text-white/40 text-xs">आर्द्रता</p>
                    <p className="text-white font-semibold">{weather.current.humidity}%</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <Wind className="w-4 h-4 text-cyan-400 mb-1" />
                    <p className="text-white/40 text-xs">वारा</p>
                    <p className="text-white font-semibold">{Math.round(weather.current.wind_speed)} km/h</p>
                    <p className="text-white/30 text-xs">{getWindDirection(weather.current.wind_direction)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <CloudRain className="w-4 h-4 text-indigo-400 mb-1" />
                    <p className="text-white/40 text-xs">पाउस</p>
                    <p className="text-white font-semibold">{weather.current.precipitation} mm</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <Thermometer className="w-4 h-4 text-orange-400 mb-1" />
                    <p className="text-white/40 text-xs">जाणवते</p>
                    <p className="text-white font-semibold">{Math.round(weather.current.feels_like)}°C</p>
                  </div>
                </div>
              </div>

              {/* Today Detail Card */}
              {selectedForecast && (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    {selectedDay === 0 ? "आजची सविस्तर माहिती" : formatDate(selectedForecast.date).full}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/50 text-sm flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-red-400" /> कमाल
                      </span>
                      <span className={`font-semibold ${getTempColor(selectedForecast.temp_max)}`}>
                        {Math.round(selectedForecast.temp_max)}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/50 text-sm flex items-center gap-2">
                        <TrendingDown className="w-3.5 h-3.5 text-blue-400" /> कमी
                      </span>
                      <span className={`font-semibold ${getTempColor(selectedForecast.temp_min)}`}>
                        {Math.round(selectedForecast.temp_min)}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/50 text-sm flex items-center gap-2">
                        <Umbrella className="w-3.5 h-3.5 text-indigo-400" /> पावसाची शक्यता
                      </span>
                      <span className="text-white font-semibold">{selectedForecast.precipitation_probability}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/50 text-sm flex items-center gap-2">
                        <CloudRain className="w-3.5 h-3.5 text-blue-400" /> पर्जन्यमान
                      </span>
                      <span className="text-white font-semibold">{selectedForecast.precipitation} mm</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/50 text-sm flex items-center gap-2">
                        <Wind className="w-3.5 h-3.5 text-cyan-400" /> वाऱ्याचा वेग
                      </span>
                      <span className="text-white font-semibold">{Math.round(selectedForecast.wind_speed)} km/h</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/50 text-sm flex items-center gap-2">
                        <Droplets className="w-3.5 h-3.5 text-blue-400" /> आर्द्रता
                      </span>
                      <span className="text-white font-semibold">{selectedForecast.humidity_min}–{selectedForecast.humidity_max}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/50 text-sm flex items-center gap-2">
                        <Sun className={`w-3.5 h-3.5 ${getUVLabel(selectedForecast.uv_index).color}`} /> UV निर्देशांक
                      </span>
                      <span className={`font-semibold ${getUVLabel(selectedForecast.uv_index).color}`}>
                        {selectedForecast.uv_index} ({getUVLabel(selectedForecast.uv_index).label})
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/50 text-sm flex items-center gap-2">
                        <Sunrise className="w-3.5 h-3.5 text-yellow-400" /> सूर्योदय
                      </span>
                      <span className="text-white font-semibold">{formatTime(selectedForecast.sunrise)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-white/50 text-sm flex items-center gap-2">
                        <Sunset className="w-3.5 h-3.5 text-orange-400" /> सूर्यास्त
                      </span>
                      <span className="text-white font-semibold">{formatTime(selectedForecast.sunset)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Temperature Bar Chart */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-orange-400" />
                तापमान अंदाज
              </h3>
              <div className="overflow-x-auto">
                <div className="flex gap-2 min-w-max pb-2">
                  {weather.forecast.map((day, i) => {
                    const { day: dayName, date } = formatDate(day.date);
                    const allTemps = weather.forecast.flatMap(d => [d.temp_max, d.temp_min]);
                    const globalMax = Math.max(...allTemps);
                    const globalMin = Math.min(...allTemps);
                    const range = globalMax - globalMin || 1;
                    const highPct = ((day.temp_max - globalMin) / range) * 100;
                    const lowPct = ((day.temp_min - globalMin) / range) * 100;

                    return (
                      <button
                        key={day.date}
                        onClick={() => setSelectedDay(i)}
                        className={`flex flex-col items-center px-3 py-3 rounded-xl transition min-w-[68px] ${
                          selectedDay === i
                            ? 'bg-blue-500/20 border border-blue-500/40'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <span className="text-white/40 text-xs font-medium">{i === 0 ? 'आज' : dayName}</span>
                        <span className="text-white/60 text-xs">{date}</span>
                        <span className="text-2xl my-2">{day.weather_emoji}</span>

                        {/* Mini temp bar */}
                        <div className="relative w-1.5 h-16 bg-white/5 rounded-full my-1">
                          <div
                            className="absolute w-full rounded-full bg-gradient-to-b from-orange-400 to-blue-400"
                            style={{
                              bottom: `${lowPct}%`,
                              height: `${highPct - lowPct}%`,
                              minHeight: '8px',
                            }}
                          />
                        </div>

                        <span className={`text-xs font-semibold ${getTempColor(day.temp_max)}`}>
                          {Math.round(day.temp_max)}°
                        </span>
                        <span className={`text-xs ${getTempColor(day.temp_min)}`}>
                          {Math.round(day.temp_min)}°
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Precipitation & Wind Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Precipitation Chart */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-blue-400" />
                पर्जन्यमान
                </h3>
                <div className="space-y-2">
                  {weather.forecast.slice(0, forecastDays).map((day, i) => {
                    const { day: dayName, date } = formatDate(day.date);
                    const maxPrecip = Math.max(...weather.forecast.map(d => d.precipitation), 1);
                    const pct = (day.precipitation / maxPrecip) * 100;

                    return (
                      <div
                        key={day.date}
                        className={`flex items-center gap-3 py-1.5 px-2 rounded-lg transition cursor-pointer ${
                          selectedDay === i ? 'bg-white/5' : 'hover:bg-white/5'
                        }`}
                        onClick={() => setSelectedDay(i)}
                      >
                        <span className="text-white/40 text-xs w-8">{i === 0 ? 'आज' : dayName}</span>
                        <span className="text-white/30 text-xs w-5">{date}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                          />
                        </div>
                        <span className="text-white/60 text-xs w-12 text-right">{day.precipitation}मिमी</span>
                        <span className="text-blue-400/60 text-xs w-8 text-right">{day.precipitation_probability}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wind Chart */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Wind className="w-5 h-5 text-cyan-400" />
                  Wind Speed
                </h3>
                <div className="space-y-2">
                  {weather.forecast.slice(0, forecastDays).map((day, i) => {
                    const { day: dayName, date } = formatDate(day.date);
                    const maxWind = Math.max(...weather.forecast.map(d => d.wind_speed), 1);
                    const pct = (day.wind_speed / maxWind) * 100;

                    return (
                      <div
                        key={day.date}
                        className={`flex items-center gap-3 py-1.5 px-2 rounded-lg transition cursor-pointer ${
                          selectedDay === i ? 'bg-white/5' : 'hover:bg-white/5'
                        }`}
                        onClick={() => setSelectedDay(i)}
                      >
                        <span className="text-white/40 text-xs w-8">{i === 0 ? 'Tod' : dayName}</span>
                        <span className="text-white/30 text-xs w-5">{date}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
                          />
                        </div>
                        <span className="text-white/60 text-xs w-16 text-right">{Math.round(day.wind_speed)} km/h</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Farming Advisory */}
            {selectedForecast && (
              <div className="rounded-2xl bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-500/20 p-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  🌾 शेती सल्ला
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedForecast.precipitation_probability > 60 && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-yellow-400 text-sm font-medium">⚠️ पावसाची जास्त शक्यता</p>
                      <p className="text-white/50 text-xs mt-1">
                        {selectedForecast.precipitation_probability}% पावसाची शक्यता. फवारणी आणि वाळवण्याची कामे पुढे ढकला.
                      </p>
                    </div>
                  )}
                  {selectedForecast.temp_max > 38 && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-red-400 text-sm font-medium">🌡️ उष्णतेचा इशारा</p>
                      <p className="text-white/50 text-xs mt-1">
                        तापमान 38°C पेक्षा जास्त. पुरेसे पाणी द्या. दुपारच्या उन्हात शेतात काम टाळा.
                      </p>
                    </div>
                  )}
                  {selectedForecast.wind_speed > 30 && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-cyan-400 text-sm font-medium">💨 जोरदार वारा</p>
                      <p className="text-white/50 text-xs mt-1">
                        वाऱ्याचा वेग 30 किमी/तास पेक्षा जास्त. संरचना सुरक्षित करा आणि कीटकनाशक फवारणी टाळा.
                      </p>
                    </div>
                  )}
                  {selectedForecast.uv_index > 7 && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-orange-400 text-sm font-medium">☀️ जास्त UV निर्देशांक</p>
                      <p className="text-white/50 text-xs mt-1">
                        UV निर्देशांक {selectedForecast.uv_index} आहे. बाहेरील कामासाठी सूर्यसंरक्षण वापरा.
                      </p>
                    </div>
                  )}
                  {selectedForecast.humidity_max > 85 && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-blue-400 text-sm font-medium">💧 जास्त आर्द्रता</p>
                      <p className="text-white/50 text-xs mt-1">
                        आर्द्रता 85% पेक्षा जास्त. बुरशीजन्य रोगांकडे लक्ष ठेवा. पिकांमध्ये चांगली हवा खेळती ठेवा.
                      </p>
                    </div>
                  )}
                  {selectedForecast.precipitation_probability <= 20 && selectedForecast.temp_max <= 35 && selectedForecast.wind_speed <= 20 && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-green-400 text-sm font-medium">✅ चांगली परिस्थिती</p>
                      <p className="text-white/50 text-xs mt-1">
                        चांगले हवामान अपेक्षित. फवारणी, पेरणी आणि शेतीच्या कामांसाठी योग्य.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Source Attribution */}
            <div className="text-center text-white/30 text-xs py-4">
              माहिती स्रोत: {weather.source} • निर्देशांक: {weather.latitude}°N, {weather.longitude}°E
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
