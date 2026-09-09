import React, { useState, useEffect } from 'react';
import { HealthApiResponse } from '../types';
import { Activity, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const HealthStatusBadge: React.FC = () => {
  const [health, setHealth] = useState<HealthApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({
        keyPresent: false,
        ltaAnswered: false,
        upstreamStatus: null,
        latencyMs: null,
        error: 'Network request failed',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="relative">
      <button
        id="api-health-button"
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && !health) checkHealth();
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
        title="View /api/health status"
      >
        <Activity className="w-3.5 h-3.5 text-slate-500" />
        <span>Backend Health</span>
        {health?.keyPresent ? (
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        ) : (
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        )}
      </button>

      {isOpen && (
        <div
          id="api-health-popover"
          className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50 text-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
            <span className="font-semibold text-slate-800">API Health Diagnostics (/api/health)</span>
            <button
              type="button"
              onClick={checkHealth}
              disabled={loading}
              className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-50"
              title="Re-check health"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">LTA_ACCOUNT_KEY present:</span>
              <span className="font-mono font-medium">
                {health?.keyPresent ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> true
                  </span>
                ) : (
                  <span className="text-rose-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> false
                  </span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">LTA Upstream answered:</span>
              <span className="font-mono font-medium">
                {health?.ltaAnswered ? (
                  <span className="text-emerald-700">true</span>
                ) : (
                  <span className="text-slate-500">false</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Upstream HTTP status:</span>
              <span className="font-mono font-medium text-slate-800">
                {health?.upstreamStatus !== null ? health?.upstreamStatus : '—'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Round-trip latency:</span>
              <span className="font-mono font-medium text-slate-800">
                {health?.latencyMs !== null && health?.latencyMs !== undefined
                  ? `${health.latencyMs} ms`
                  : '—'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Reports boolean key presence only — never exposes credentials.
          </div>
        </div>
      )}
    </div>
  );
};
