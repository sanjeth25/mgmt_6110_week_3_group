import React from 'react';
import { Footprints, Minus, Plus } from 'lucide-react';

interface WalkingTimeSelectorProps {
  walkMinutes: number;
  onChange: (newWalk: number) => void;
}

const PRESETS = [3, 5, 8, 10];

export const WalkingTimeSelector: React.FC<WalkingTimeSelectorProps> = ({
  walkMinutes,
  onChange,
}) => {
  const handleDecrement = () => {
    if (walkMinutes > 1) {
      onChange(walkMinutes - 1);
    }
  };

  const handleIncrement = () => {
    if (walkMinutes < 30) {
      onChange(walkMinutes + 1);
    }
  };

  return (
    <div
      id="walking-time-card"
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Your Walking Time to Stop
            </div>
            <div className="text-xl font-bold text-slate-900 flex items-baseline gap-1">
              <span>{walkMinutes}</span>
              <span className="text-sm font-normal text-slate-500">
                {walkMinutes === 1 ? 'minute' : 'minutes'}
              </span>
            </div>
          </div>
        </div>

        {/* Stepper and presets */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
            <button
              id="walk-decrement-btn"
              type="button"
              onClick={handleDecrement}
              disabled={walkMinutes <= 1}
              aria-label="Decrease walking time"
              className="w-8 h-8 rounded-md flex items-center justify-center text-slate-700 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-semibold text-sm text-slate-800">
              {walkMinutes}m
            </span>
            <button
              id="walk-increment-btn"
              type="button"
              onClick={handleIncrement}
              disabled={walkMinutes >= 30}
              aria-label="Increase walking time"
              className="w-8 h-8 rounded-md flex items-center justify-center text-slate-700 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                id={`preset-${preset}-min`}
                type="button"
                onClick={() => onChange(preset)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  walkMinutes === preset
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {preset}m
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <span>Changing walking time recalculates leave verdicts instantly</span>
        <span className="font-mono text-[11px] text-slate-400">Saved locally</span>
      </div>
    </div>
  );
};
