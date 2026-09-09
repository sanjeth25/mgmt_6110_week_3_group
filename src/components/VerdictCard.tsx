import React from 'react';
import { BusServiceArrival } from '../types';
import { computeVerdict, formatWaitTime } from '../utils/verdict';
import { Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface VerdictCardProps {
  service: BusServiceArrival;
  walkMinutes: number;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  service,
  walkMinutes,
}) => {
  const serviceNo = service.serviceNo || service.ServiceNo || 'Unknown';
  const wait1 = service.nextBus;
  const wait2 = service.nextBus2;

  const verdict = computeVerdict(serviceNo, wait1, wait2, walkMinutes);

  // Styling based on verdict status
  const badgeStyles = {
    LEAVE_NOW: 'bg-emerald-600 text-white border-emerald-700 shadow-xs',
    SOON: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
    NOT_YET: 'bg-sky-100 text-sky-900 border-sky-300',
    TOO_LATE: 'bg-rose-100 text-rose-800 border-rose-200',
    NOT_OPERATING: 'bg-slate-100 text-slate-600 border-slate-200',
  }[verdict.status];

  const cardBorder = {
    LEAVE_NOW: 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-400/20',
    SOON: 'border-amber-200 bg-white',
    NOT_YET: 'border-slate-200 bg-white',
    TOO_LATE: 'border-slate-200 bg-white',
    NOT_OPERATING: 'border-slate-200 bg-slate-50/50',
  }[verdict.status];

  return (
    <div
      id={`service-card-${serviceNo}`}
      className={`border rounded-xl p-4 sm:p-5 transition-all shadow-xs ${cardBorder}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        {/* Service Number Badge */}
        <div className="flex items-center gap-3">
          <div
            id={`service-no-${serviceNo}`}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-lg tracking-tight shadow-xs"
          >
            {serviceNo}
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Bus Service</div>
            <div className="text-sm font-semibold text-slate-800">
              Stop 04121
            </div>
          </div>
        </div>

        {/* Verdict Badge */}
        <div className="flex items-center gap-2">
          <span
            id={`verdict-badge-${serviceNo}`}
            className={`px-3 py-1 text-xs uppercase tracking-wider rounded-full border flex items-center gap-1.5 font-bold ${badgeStyles}`}
          >
            {verdict.status === 'LEAVE_NOW' && (
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            {verdict.status === 'TOO_LATE' && (
              <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            {verdict.status === 'SOON' && (
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            {verdict.badgeText}
          </span>
        </div>
      </div>

      {/* Arrival Waits Grid */}
      <div className="grid grid-cols-2 gap-3 my-3.5 py-2.5 px-3 bg-slate-50/80 rounded-lg border border-slate-100">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1">
            Next Bus
            {verdict.activeBus === 1 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </span>
          <span
            id={`bus1-wait-${serviceNo}`}
            className={`text-lg font-bold mt-0.5 ${
              wait1 === 0
                ? 'text-emerald-700 animate-pulse'
                : wait1 !== null && wait1 <= walkMinutes
                ? 'text-rose-700'
                : 'text-slate-900'
            }`}
          >
            {formatWaitTime(wait1)}
          </span>
        </div>

        <div className="flex flex-col border-l border-slate-200 pl-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1">
            Subsequent Bus
            {verdict.activeBus === 2 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </span>
          <span
            id={`bus2-wait-${serviceNo}`}
            className={`text-lg font-bold mt-0.5 ${
              wait2 === 0
                ? 'text-emerald-700 animate-pulse'
                : wait2 !== null && wait2 <= walkMinutes
                ? 'text-rose-700'
                : 'text-slate-900'
            }`}
          >
            {formatWaitTime(wait2)}
          </span>
        </div>
      </div>

      {/* Plain Sentence Verdict */}
      <div
        id={`verdict-sentence-${serviceNo}`}
        className="text-sm font-medium text-slate-700 leading-relaxed pt-1 flex items-start gap-2"
      >
        <ArrowRight className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <span>{verdict.sentence}</span>
      </div>
    </div>
  );
};
