import React from 'react';
import { KeyRound, WifiOff, AlertTriangle, BusFront } from 'lucide-react';

interface FailureNoticeProps {
  type: 'missing_key' | 'unreachable' | 'non_200' | 'no_services';
  upstreamStatus?: number;
  message?: string;
  onRetry?: () => void;
}

export const FailureNotice: React.FC<FailureNoticeProps> = ({
  type,
  upstreamStatus,
  message,
  onRetry,
}) => {
  if (type === 'missing_key') {
    return (
      <div
        id="missing-key-banner"
        className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900 shadow-xs"
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-sm">
            <h3 className="font-semibold text-base text-amber-950">
              LTA_ACCOUNT_KEY Not Configured
            </h3>
            <p className="text-amber-800 leading-relaxed">
              The serverless API requires an LTA DataMall account key to fetch live bus arrival data.
              In Vercel production, configure this as an environment variable named{' '}
              <code className="font-mono bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-950 font-semibold">
                LTA_ACCOUNT_KEY
              </code>
              .
            </p>
            <div className="pt-2 text-xs text-amber-700">
              The app never prints or exposes the key. You can test <code className="font-mono font-medium">/api/health</code> to verify server status.
            </div>
            {onRetry && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Check Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'unreachable') {
    return (
      <div
        id="lta-unreachable-banner"
        className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-rose-900 shadow-xs"
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-800 shrink-0 mt-0.5">
            <WifiOff className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-sm">
            <h3 className="font-semibold text-base text-rose-950">
              LTA DataMall Service Unreachable
            </h3>
            <p className="text-rose-800 leading-relaxed">
              {message || 'The serverless API could not establish a connection to datamall2.mytransport.sg. Please check network connectivity or try again shortly.'}
            </p>
            {onRetry && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1.5 bg-rose-800 hover:bg-rose-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Retry Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'non_200') {
    return (
      <div
        id="lta-non200-banner"
        className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-rose-900 shadow-xs"
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-800 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-sm">
            <h3 className="font-semibold text-base text-rose-950">
              Upstream LTA Error {upstreamStatus ? `(HTTP ${upstreamStatus})` : ''}
            </h3>
            <p className="text-rose-800 leading-relaxed">
              {upstreamStatus === 401 || upstreamStatus === 403
                ? 'LTA DataMall rejected the request (HTTP 401/403). Ensure LTA_ACCOUNT_KEY is valid and registered with DataMall.'
                : message || `LTA DataMall returned an unexpected response code: ${upstreamStatus}.`}
            </p>
            {onRetry && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1.5 bg-rose-800 hover:bg-rose-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'no_services') {
    return (
      <div
        id="no-services-banner"
        className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center shadow-xs"
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
          <BusFront className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-base text-slate-800 mb-1">
          No Buses Running
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          No bus services are currently operating or scheduled for this bus stop. Please check back during operating hours.
        </p>
      </div>
    );
  }

  return null;
};
