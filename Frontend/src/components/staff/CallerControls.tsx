import {
  Megaphone,
  CheckCircle,
  XCircle,
  PlayCircle,
  User,
  Clock,
} from '@phosphor-icons/react';

export interface CurrentTicket {
  id: string;
  number: string;
  customerName: string;
  serviceType: string;
  waitTimeMinutes: number;
}

interface CallerControlsProps {
  currentTicket: CurrentTicket | null;
  queueCount: number;
  onCallNext: () => void;
  onRecall: () => void;
  onComplete: () => void;
  onNoShow: () => void;
  loading?: boolean;
}

export function CallerControls({
  currentTicket,
  queueCount,
  onCallNext,
  onRecall,
  onComplete,
  onNoShow,
  loading = false,
}: CallerControlsProps) {
  return (
    <div className="space-y-6">
      {/* Active Serving Display */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 text-center relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {currentTicket ? 'Serving Now' : 'Idle'}
          </span>
        </div>

        <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2">
          Current Ticket Number
        </div>

        <div className="text-6xl font-mono font-bold text-zinc-100 tracking-tight my-4">
          {currentTicket ? currentTicket.number : '— — —'}
        </div>

        {currentTicket ? (
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-200">
              <User size={16} className="text-emerald-400" />
              {currentTicket.customerName || 'Anonymous Customer'}
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Clock size={16} className="text-emerald-400" />
              Waited {currentTicket.waitTimeMinutes}m
            </span>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 mt-2">
            No active customer. Click "Call Next Ticket" when ready.
          </p>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Call Next Button */}
        <button
          onClick={onCallNext}
          disabled={loading || queueCount === 0}
          className="col-span-1 sm:col-span-2 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-zinc-950 font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
        >
          <PlayCircle size={24} weight="bold" />
          <span>Call Next Ticket ({queueCount} Waiting)</span>
        </button>

        {/* Recall Audio Broadcast */}
        <button
          onClick={onRecall}
          disabled={!currentTicket || loading}
          className="py-3.5 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 disabled:opacity-40 text-zinc-200 font-medium text-sm flex items-center justify-center gap-2 border border-zinc-700/50 transition-colors cursor-pointer"
        >
          <Megaphone size={18} className="text-amber-400" />
          <span>Re-announce Ticket</span>
        </button>

        {/* Complete Session */}
        <button
          onClick={onComplete}
          disabled={!currentTicket || loading}
          className="py-3.5 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 disabled:opacity-40 text-emerald-400 font-medium text-sm flex items-center justify-center gap-2 border border-zinc-700/50 hover:border-emerald-500/30 transition-colors cursor-pointer"
        >
          <CheckCircle size={18} />
          <span>Complete Session</span>
        </button>

        {/* Mark No-Show */}
        <button
          onClick={onNoShow}
          disabled={!currentTicket || loading}
          className="col-span-1 sm:col-span-2 py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 disabled:opacity-40 text-rose-400 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <XCircle size={16} />
          <span>Mark as No-Show / Cancel</span>
        </button>
      </div>
    </div>
  );
}