/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BusApiResponse, BusServiceArrival } from './types';
import { WalkingTimeSelector } from './components/WalkingTimeSelector';
import { VerdictCard } from './components/VerdictCard';
import { FailureNotice } from './components/FailureNotice';
import { HealthStatusBadge } from './components/HealthStatusBadge';
import {
  Navigation,
  RefreshCw,
  Clock,
  AlertCircle,
  Bus,
  Search,
  RotateCcw,
} from 'lucide-react';

const DEFAULT_STOP = '04121';
const STORAGE_KEY = 'should_i_leave_now_walking_time';

export default function App() {
  // Walking time state, persisted in localStorage, defaults to 5 minutes
  const [walkMinutes, setWalkMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) {
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
    return 5;
  });

  // Bus Stop Code, defaulting to 04121
  const [busStopCode, setBusStopCode] = useState<string>(DEFAULT_STOP);
  const [stopInput, setStopInput] = useState<string>(DEFAULT_STOP);

  // API State
  const [busData, setBusData] = useState<BusApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [failureType, setFailureType] = useState<
    'missing_key' | 'unreachable' | 'non_200' | 'no_services' | null
  >(null);
  const [failureStatus, setFailureStatus] = useState<number | undefined>(undefined);
  const [failureMessage, setFailureMessage] = useState<string>('');

  // Data age tracking
  const [dataAgeText, setDataAgeText] = useState<string>('');
  const [isStale, setIsStale] = useState<boolean>(false);

  const isInitialMount = useRef<boolean>(true);

  // Save walking time to localStorage immediately without refetching
  const handleWalkChange = (newWalk: number) => {
    setWalkMinutes(newWalk);
    try {
      localStorage.setItem(STORAGE_KEY, String(newWalk));
    } catch {
      // Ignore localStorage write errors
    }
  };

  // Fetch bus arrival data from /api/bus
  const fetchBusData = useCallback(
    async (isBackgroundRefresh = false) => {
      if (isBackgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const url = `/api/bus?BusStopCode=${encodeURIComponent(busStopCode)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          if (data?.error === 'MISSING_KEY' || res.status === 500) {
            setFailureType('missing_key');
            setFailureMessage(data?.message || 'LTA_ACCOUNT_KEY is not configured');
          } else if (data?.error === 'LTA_UNREACHABLE' || res.status === 502) {
            setFailureType('unreachable');
            setFailureMessage(data?.message || 'Upstream LTA service unreachable');
          } else {
            setFailureType('non_200');
            setFailureStatus(res.status);
            setFailureMessage(data?.message || `Upstream returned HTTP ${res.status}`);
          }
          // Do NOT invent arrival numbers as fallback!
          // Mark data as stale if we had previous data
          if (busData) {
            setIsStale(true);
          }
          return;
        }

        // Success (HTTP 200)
        setBusData(data);
        setIsStale(false);

        // Check if services array is empty ("no buses running")
        if (!data.services || data.services.length === 0) {
          setFailureType('no_services');
        } else {
          setFailureType(null);
        }
      } catch (err) {
        setFailureType('unreachable');
        setFailureMessage('Network error communicating with /api/bus');
        if (busData) {
          setIsStale(true);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [busStopCode, busData]
  );

  // Initial fetch on mount or when busStopCode changes
  useEffect(() => {
    fetchBusData(false);
  }, [busStopCode]);

  // Live timer tick for data age display & staleness detection
  useEffect(() => {
    const updateAge = () => {
      if (busData?.timestamp) {
        const secondsAgo = Math.max(0, Math.floor((Date.now() - busData.timestamp) / 1000));
        if (secondsAgo < 5) {
          setDataAgeText('just now');
        } else if (secondsAgo < 60) {
          setDataAgeText(`${secondsAgo}s ago`);
        } else {
          const mins = Math.floor(secondsAgo / 60);
          setDataAgeText(`${mins}m ago`);
        }
        // Mark stale if data is older than 60 seconds
        setIsStale(secondsAgo > 60);
      }
    };

    updateAge();
    const interval = setInterval(updateAge, 1000);
    return () => clearInterval(interval);
  }, [busData?.timestamp]);

  // Refresh every 30 seconds, strictly only while the tab is visible
  useEffect(() => {
    let timerId: ReturnJSInterval | null = null;

    const startTimer = () => {
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchBusData(true);
        }
      }, 30000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBusData(true);
        startTimer();
      } else {
        if (timerId) clearInterval(timerId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startTimer();

    return () => {
      if (timerId) clearInterval(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchBusData]);

  type ReturnJSInterval = ReturnType<typeof setInterval>;

  const handleStopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = stopInput.trim();
    if (clean && clean !== busStopCode) {
      setBusStopCode(clean);
    }
  };

  const resetToDefaultStop = () => {
    setStopInput(DEFAULT_STOP);
    setBusStopCode(DEFAULT_STOP);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                Should I Leave Now?
              </h1>
              <div className="text-[11px] text-slate-500 font-medium">
                Singapore Bus Leave-Now Advisor
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HealthStatusBadge />
            <button
              id="refresh-button"
              type="button"
              onClick={() => fetchBusData(false)}
              disabled={loading || refreshing}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-40 cursor-pointer"
              title="Refresh bus arrivals"
              aria-label="Refresh bus arrivals"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing || loading ? 'animate-spin text-emerald-600' : ''}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-5 sm:space-y-6">
        {/* Walking Time Control (Core Control) */}
        <section aria-labelledby="walking-time-heading">
          <WalkingTimeSelector
            walkMinutes={walkMinutes}
            onChange={handleWalkChange}
          />
        </section>

        {/* Bus Stop Selector & Status Bar */}
        <section
          id="bus-stop-bar"
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <form onSubmit={handleStopSubmit} className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                <Bus className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Bus Stop</span>
              </div>
              <div className="relative">
                <input
                  id="bus-stop-input"
                  type="text"
                  value={stopInput}
                  onChange={(e) => setStopInput(e.target.value)}
                  placeholder="04121"
                  maxLength={6}
                  className="w-24 px-2.5 py-1.5 font-mono text-sm font-semibold border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 text-slate-800 text-center"
                />
              </div>
              <button
                id="search-stop-button"
                type="submit"
                disabled={stopInput.trim() === busStopCode}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Go
              </button>
              {busStopCode !== DEFAULT_STOP && (
                <button
                  type="button"
                  onClick={resetToDefaultStop}
                  title="Reset to default stop 04121"
                  className="p-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </form>

            {/* Refresh countdown & status info */}
            <div className="flex items-center gap-3 text-xs text-slate-500 self-end sm:self-auto">
              {busData?.fetchedAt && (
                <span
                  id="data-age-indicator"
                  className={`flex items-center gap-1.5 ${
                    isStale ? 'text-amber-700 font-medium' : 'text-slate-500'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {isStale ? (
                    <span>Data is stale (fetched {dataAgeText})</span>
                  ) : (
                    <span>Updated {dataAgeText}</span>
                  )}
                </span>
              )}

              <span className="text-slate-300">|</span>
              <span className="text-[11px] text-slate-400">
                Auto-refreshes every 30s (when visible)
              </span>
            </div>
          </div>
        </section>

        {/* Failure state notices */}
        {failureType && (
          <section aria-live="polite">
            <FailureNotice
              type={failureType}
              upstreamStatus={failureStatus}
              message={failureMessage}
              onRetry={() => fetchBusData(false)}
            />
          </section>
        )}

        {/* Loading Spinner during initial load */}
        {loading && !busData && (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">
              Checking bus arrivals for Stop {busStopCode}...
            </p>
          </div>
        )}

        {/* Verdict Panel — Core Screen */}
        {busData && busData.services && busData.services.length > 0 && (
          <section
            id="verdict-panel"
            aria-label="Bus Services and Leave Verdicts"
            className="space-y-3.5"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Services at Stop {busStopCode} ({busData.services.length})
              </h2>
              <span className="text-xs text-slate-400">
                Based on a {walkMinutes}-minute walk
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {busData.services.map((service) => (
                <VerdictCard
                  key={service.serviceNo || service.ServiceNo || Math.random()}
                  service={service}
                  walkMinutes={walkMinutes}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 space-y-1.5">
          <p id="data-source-attribution" className="font-medium text-slate-600">
            Data source: LTA DataMall, under the Singapore Open Data Licence v1.0.
          </p>
          <p className="text-[11px] text-slate-400">
            This independent leave-now tool is not affiliated with or endorsed by the Land Transport Authority.
          </p>
        </div>
      </footer>
    </div>
  );
}
