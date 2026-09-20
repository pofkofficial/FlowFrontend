import { Browsers, UserCheck, Power } from '@phosphor-icons/react';

export interface CounterState {
  id: string;
  name: string;
  serviceType: string;
  isOnline: boolean;
  assignedStaff?: string;
  currentTicket?: string;
}

interface CounterManagerProps {
  counters: CounterState[];
  onToggleCounter?: (id: string, currentStatus: boolean) => void;
}

export function CounterManager({ counters, onToggleCounter }: CounterManagerProps) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Browsers size={20} className="text-emerald-400" weight="duotone" />
            Counter Overview
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Operational status and active staff assignments across counters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {counters.map((c) => (
          <div
            key={c.id}
            className={`p-4 rounded-xl border transition-all ${
              c.isOnline
                ? 'bg-zinc-950/60 border-zinc-800'
                : 'bg-zinc-950/20 border-zinc-800/40 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-zinc-100 font-mono">
                {c.name}
              </span>
              
              <button
                onClick={() => onToggleCounter?.(c.id, c.isOnline)}
                className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  c.isOnline
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-emerald-400'
                }`}
                title={c.isOnline ? 'Deactivate Counter' : 'Activate Counter'}
              >
                <Power size={14} />
                <span>{c.isOnline ? 'Online' : 'Offline'}</span>
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Service:</span>
                <span className="text-zinc-200 font-medium">{c.serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span>Staff:</span>
                <span className="text-zinc-200 flex items-center gap-1">
                  <UserCheck size={14} className="text-emerald-400" />
                  {c.assignedStaff || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-800/60">
                <span>Current Ticket:</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {c.currentTicket || 'Idle'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}