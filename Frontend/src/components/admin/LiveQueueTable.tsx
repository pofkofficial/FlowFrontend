import { Ticket, ArrowClockwise } from '@phosphor-icons/react';

export interface QueueTicket {
  id: string;
  number: string;
  customerName: string;
  serviceType: string;
  status: 'WAITING' | 'SERVING' | 'COMPLETED' | 'CANCELLED';
  counterName?: string;
  waitTimeMinutes: number;
  createdAt: string;
}

interface LiveQueueTableProps {
  tickets: QueueTicket[];
  onRefresh?: () => void;
}

export function LiveQueueTable({ tickets, onRefresh }: LiveQueueTableProps) {
  const getStatusBadge = (status: QueueTicket['status']) => {
    switch (status) {
      case 'SERVING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Serving
          </span>
        );
      case 'WAITING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Waiting
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Ticket size={20} className="text-emerald-400" weight="duotone" />
            Live Ticket Traffic
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time status of active, serving, and recently finished tickets
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors cursor-pointer"
            title="Refresh Table"
          >
            <ArrowClockwise size={18} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-950/50 text-xs font-medium uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80">
            <tr>
              <th className="px-5 py-3.5">Ticket #</th>
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Service</th>
              <th className="px-5 py-3.5">Counter</th>
              <th className="px-5 py-3.5">Wait Time</th>
              <th className="px-5 py-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-zinc-500 text-xs">
                  No active tickets in queue at the moment.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-4 font-mono font-semibold text-emerald-400">
                    {t.number}
                  </td>
                  <td className="px-5 py-4 font-medium text-zinc-200">
                    {t.customerName || 'Anonymous'}
                  </td>
                  <td className="px-5 py-4 text-zinc-400">{t.serviceType}</td>
                  <td className="px-5 py-4 text-zinc-300">
                    {t.counterName || <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-5 py-4 font-mono text-zinc-400">
                    {t.waitTimeMinutes}m
                  </td>
                  <td className="px-5 py-4 text-right">
                    {getStatusBadge(t.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}