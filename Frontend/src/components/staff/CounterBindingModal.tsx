import React, { useState } from 'react';
import { Browsers, ArrowRight, Warning } from '@phosphor-icons/react';

export interface AvailableCounter {
  id: string;
  name: string;
  serviceType: string;
  isOccupied: boolean;
}

interface CounterBindingModalProps {
  counters: AvailableCounter[];
  onSelectCounter: (counterId: string) => void;
  loading?: boolean;
}

export function CounterBindingModal({
  counters,
  onSelectCounter,
  loading = false,
}: CounterBindingModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId) {
      onSelectCounter(selectedId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Browsers size={24} weight="duotone" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Select Counter Shift</h2>
            <p className="text-xs text-zinc-400">Choose your assigned desk for this session</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {counters.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                No active counters available. Contact your system administrator.
              </div>
            ) : (
              counters.map((c) => {
                const isDisabled = c.isOccupied;
                const isSelected = selectedId === c.id;

                return (
                  <label
                    key={c.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isDisabled
                        ? 'bg-zinc-950/30 border-zinc-800/40 text-zinc-600 cursor-not-allowed'
                        : isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-zinc-100'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="counter"
                        disabled={isDisabled}
                        checked={isSelected}
                        onChange={() => setSelectedId(c.id)}
                        className="accent-emerald-400"
                      />
                      <div>
                        <div className="font-mono font-medium text-sm">{c.name}</div>
                        <div className="text-xs text-zinc-400">{c.serviceType}</div>
                      </div>
                    </div>

                    {isDisabled && (
                      <span className="text-[10px] font-medium uppercase tracking-wider text-amber-500 flex items-center gap-1">
                        <Warning size={12} />
                        Occupied
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          <button
            type="submit"
            disabled={!selectedId || loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>{loading ? 'Binding Shift...' : 'Begin Counter Shift'}</span>
            <ArrowRight size={18} weight="bold" />
          </button>
        </form>
      </div>
    </div>
  );
}