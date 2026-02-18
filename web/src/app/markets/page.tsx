'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  BarChart3,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Store,
  Package,
  MapPin,
  IndianRupee,
  Calendar,
  X,
  Wheat,
  ShoppingCart,
  Database,
} from 'lucide-react';
import { apiUrl } from '@/lib/api-config';

interface PriceRecord {
  commodity: string;
  variety: string;
  market: string;
  district: string;
  min_price: number | null;
  max_price: number | null;
  modal_price: number | null;
  arrival_date: string;
}

interface Commodity {
  name: string;
  records: number;
  avg_price: number | null;
  min_price: number | null;
  max_price: number | null;
  markets: number;
}

interface MarketSummary {
  total_records: number;
  total_commodities: number;
  total_markets: number;
  total_districts: number;
  data_date: string;
  top_commodities: Array<{ name: string; avg_price: number; records: number }>;
  source: string;
}

interface PriceResponse {
  prices: PriceRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  data_date: string;
  source: string;
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '—';
  return '₹' + price.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function getPriceColor(price: number | null): string {
  if (!price) return 'text-white/40';
  if (price < 2000) return 'text-green-400';
  if (price < 5000) return 'text-emerald-400';
  if (price < 10000) return 'text-yellow-400';
  return 'text-orange-400';
}

export default function MarketsPage() {
  // Summary data
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [commoditiesList, setCommoditiesList] = useState<Commodity[]>([]);

  // Prices data
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [dataDate, setDataDate] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [sortBy, setSortBy] = useState('commodity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  // UI state
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCommodityFilter, setShowCommodityFilter] = useState(false);
  const [commoditySearch, setCommoditySearch] = useState('');
  const [activeTab, setActiveTab] = useState<'prices' | 'commodities'>('prices');

  // Fetch summary
  useEffect(() => {
    setSummaryLoading(true);
    Promise.all([
      fetch(apiUrl('/api/market/summary')).then(r => r.json()),
      fetch(apiUrl('/api/market/commodities')).then(r => r.json()),
    ])
      .then(([sumData, comData]) => {
        setSummary(sumData);
        setCommoditiesList(comData.commodities || []);
      })
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  }, []);

  // Fetch prices
  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCommodity) params.set('commodity', selectedCommodity);
      if (selectedDistrict) params.set('district', selectedDistrict);
      params.set('sort_by', sortBy);
      params.set('sort_order', sortOrder);
      params.set('page', page.toString());
      params.set('page_size', pageSize.toString());

      const res = await fetch(apiUrl(`/api/market/prices?${params.toString()}`));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to fetch prices');
      }
      const data: PriceResponse = await res.json();
      setPrices(data.prices);
      setTotalRecords(data.total);
      setTotalPages(data.total_pages);
      setDataDate(data.data_date);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCommodity, selectedDistrict, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedCommodity, selectedDistrict, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 text-white/20" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-400" />
    );
  };

  const filteredCommodities = commoditiesList.filter(c =>
    c.name.toLowerCase().includes(commoditySearch.toLowerCase())
  );

  const clearFilters = () => {
    setSearch('');
    setSelectedCommodity('');
    setSelectedDistrict('');
    setSortBy('commodity');
    setSortOrder('asc');
    setPage(1);
  };

  const hasActiveFilters = search || selectedCommodity || selectedDistrict;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-green-950">
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
                  <Store className="w-7 h-7 text-emerald-400" />
                  Market Analytics
                </h1>
                <p className="text-white/50 text-sm">
                  Live mandi prices from AGMARKNET • Maharashtra
                </p>
              </div>
            </div>
            {dataDate && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
                <Calendar className="w-4 h-4" />
                {dataDate}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Summary Stats */}
        {!summaryLoading && summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
          >
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <Database className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-2xl font-bold text-white">{summary.total_records.toLocaleString()}</p>
              <p className="text-white/40 text-xs">Total Records</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <Package className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="text-2xl font-bold text-white">{summary.total_commodities}</p>
              <p className="text-white/40 text-xs">Commodities</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <Store className="w-5 h-5 text-orange-400 mb-2" />
              <p className="text-2xl font-bold text-white">{summary.total_markets}</p>
              <p className="text-white/40 text-xs">Markets</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <MapPin className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-2xl font-bold text-white">{summary.total_districts}</p>
              <p className="text-white/40 text-xs">Districts</p>
            </div>
          </motion.div>
        )}

        {/* Tab Toggle */}
        <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('prices')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'prices'
                ? 'bg-emerald-500 text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <IndianRupee className="w-4 h-4 inline mr-1" />
            Live Prices
          </button>
          <button
            onClick={() => setActiveTab('commodities')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'commodities'
                ? 'bg-emerald-500 text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wheat className="w-4 h-4 inline mr-1" />
            Commodities
          </button>
        </div>

        {/* ============ PRICES TAB ============ */}
        {activeTab === 'prices' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search commodity, market, or district..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-emerald-500/50"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Commodity Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowCommodityFilter(!showCommodityFilter)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition whitespace-nowrap ${
                    selectedCommodity
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  {selectedCommodity || 'All Commodities'}
                  <ChevronDown className={`w-3.5 h-3.5 transition ${showCommodityFilter ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showCommodityFilter && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 top-full mt-2 right-0 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/10">
                        <input
                          type="text"
                          placeholder="Search commodities..."
                          value={commoditySearch}
                          onChange={e => setCommoditySearch(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-emerald-500/50"
                          autoFocus
                        />
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => { setSelectedCommodity(''); setShowCommodityFilter(false); setCommoditySearch(''); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                            !selectedCommodity ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/60 hover:bg-white/5'
                          }`}
                        >
                          All Commodities
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2 pt-0">
                        {filteredCommodities.map(c => (
                          <button
                            key={c.name}
                            onClick={() => { setSelectedCommodity(c.name); setShowCommodityFilter(false); setCommoditySearch(''); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex justify-between ${
                              selectedCommodity === c.name
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'text-white/60 hover:bg-white/5'
                            }`}
                          >
                            <span>{c.name}</span>
                            <span className="text-white/20 text-xs">{c.records} records</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm hover:bg-red-500/20 transition whitespace-nowrap"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between mb-3 text-sm">
              <p className="text-white/40">
                Showing {prices.length} of {totalRecords.toLocaleString()} records
                {selectedCommodity && <span className="text-emerald-400"> • {selectedCommodity}</span>}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            )}

            {/* Prices Table */}
            {!loading && prices.length > 0 && (
              <>
                <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          {[
                            { key: 'commodity', label: 'Commodity' },
                            { key: 'variety', label: 'Variety' },
                            { key: 'market', label: 'Market' },
                            { key: 'district', label: 'District' },
                            { key: 'min_price', label: 'Min ₹' },
                            { key: 'max_price', label: 'Max ₹' },
                            { key: 'modal_price', label: 'Modal ₹' },
                          ].map(col => (
                            <th
                              key={col.key}
                              onClick={() => handleSort(col.key)}
                              className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-white/60 transition select-none"
                            >
                              <span className="flex items-center gap-1">
                                {col.label}
                                <SortIcon field={col.key} />
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {prices.map((p, i) => (
                          <motion.tr
                            key={`${p.commodity}-${p.market}-${p.variety}-${i}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.01 }}
                            className="hover:bg-white/5 transition"
                          >
                            <td className="px-4 py-3">
                              <span className="text-white font-medium text-sm">{p.commodity}</span>
                            </td>
                            <td className="px-4 py-3 text-white/50 text-sm">{p.variety || '—'}</td>
                            <td className="px-4 py-3 text-white/70 text-sm">{p.market}</td>
                            <td className="px-4 py-3 text-white/50 text-sm">{p.district}</td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-medium ${getPriceColor(p.min_price)}`}>
                                {formatPrice(p.min_price)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-medium ${getPriceColor(p.max_price)}`}>
                                {formatPrice(p.max_price)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-semibold ${getPriceColor(p.modal_price)}`}>
                                {formatPrice(p.modal_price)}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-white/30 text-sm">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = idx + 1;
                        } else if (page <= 3) {
                          pageNum = idx + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + idx;
                        } else {
                          pageNum = page - 2 + idx;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                              page === pageNum
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* No results */}
            {!loading && prices.length === 0 && !error && (
              <div className="text-center py-16">
                <ShoppingCart className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No prices found matching your filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-3 text-emerald-400 text-sm hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ============ COMMODITIES TAB ============ */}
        {activeTab === 'commodities' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {summaryLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {commoditiesList.map((c, i) => (
                  <motion.div
                    key={c.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => { setSelectedCommodity(c.name); setActiveTab('prices'); }}
                    className="rounded-xl bg-white/5 border border-white/10 p-4 cursor-pointer hover:bg-white/[0.08] hover:border-emerald-500/20 transition group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-sm group-hover:text-emerald-300 transition">
                          {c.name}
                        </h3>
                        <p className="text-white/30 text-xs mt-0.5">{c.records} records • {c.markets} markets</p>
                      </div>
                      <Package className="w-4 h-4 text-white/20 group-hover:text-emerald-500/50 transition" />
                    </div>
                    <div className="flex items-end gap-4">
                      <div>
                        <p className="text-white/30 text-[10px] uppercase tracking-wider">Avg Price</p>
                        <p className={`text-lg font-bold ${getPriceColor(c.avg_price)}`}>
                          {formatPrice(c.avg_price)}
                        </p>
                      </div>
                      <div className="flex-1 flex justify-end gap-3">
                        <div className="text-right">
                          <p className="text-white/30 text-[10px]">MIN</p>
                          <p className="text-green-400/80 text-xs font-medium">{formatPrice(c.min_price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/30 text-[10px]">MAX</p>
                          <p className="text-orange-400/80 text-xs font-medium">{formatPrice(c.max_price)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Source Attribution */}
        <div className="text-center text-white/30 text-xs py-6 mt-4">
          Data powered by Data.gov.in (AGMARKNET) • Prices in ₹ per Quintal
        </div>
      </div>
    </div>
  );
}
