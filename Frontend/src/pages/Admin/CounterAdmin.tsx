import { useState } from 'react';
import { DesktopIcon, UserFocusIcon, PlusIcon } from '@phosphor-icons/react';
import { apiFetch } from '../../services/api';

export interface Counter {
  id: string;
  counterNumber: number;
  counterName: string;
  isOnline: boolean;
  currentStaff?: {
    id: string;
    fullName: string;
    employeeId: string;
  } | null;
}

interface Props {
  counters: Counter[];
  onRefresh: () => void;
}

export function CounterAdmin({ counters, onRefresh }: Props) {
  const [counterNumber, setCounterNumber] = useState<number>(counters.length + 1);
  const [counterName, setCounterName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleCreateCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/counters', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          counterNumber: Number(counterNumber),
          name: counterName.trim(), // Standard field name
          counterName: counterName.trim(), // Fallback if backend strictly checks counterName
        }),
      });
      setCounterName('');
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to create counter', err);
    }
  };

  const handleForceUnbind = async (counterId: string, counterName: string) => {
    if (!confirm(`Force unbind active staff from ${counterName}?`)) return;
    try {
      await apiFetch(`/admin/counters/${counterId}/force-unbind`, { method: 'POST' });
      onRefresh();
    } catch (err) {
      console.error('Failed to force unbind staff:', err);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Physical Register Desks</h2>
          <p className="text-xs text-zinc-400">Configure counter registers and perform emergency shift handovers</p>
        </div>
        <button
          onClick={() => setIsAdding((prev) => !prev)}
          className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs rounded-xl transition-colors cursor-pointer"
        >
          <PlusIcon size={16} />
          <span>New Counter</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreateCounter} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-end gap-3 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Counter No.</label>
            <input
              type="number"
              required
              value={counterNumber}
              onChange={(e) => setCounterNumber(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100"
            />
          </div>
          <div className="flex-1">
            <label className="block text-zinc-400 mb-1">Desk Designation Name</label>
            <input
              type="text"
              required
              placeholder="e.g. VIP / Priority Desk"
              value={counterName}
              onChange={(e) => setCounterName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-emerald-500 text-zinc-950 font-medium rounded-lg hover:bg-emerald-600">
            Save Register
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {counters.map((c) => (
          <div key={c.id} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
                <DesktopIcon size={20} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">
                  Desk {c.counterNumber}: {c.counterName}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {c.currentStaff ? `Bound: ${c.currentStaff.fullName}` : 'Unassigned'}
                </p>
              </div>
            </div>

            {c.currentStaff && (
              <button
                onClick={() => handleForceUnbind(c.id, c.counterName)}
                className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                title="Force Unbind Staff"
              >
                <UserFocusIcon size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}