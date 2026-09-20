import { useEffect, useState } from 'react';
import { ChartBarIcon, ArrowClockwiseIcon } from '@phosphor-icons/react';
import { apiFetch } from '../../services/api';

export interface StaffMetric {
  staffId: string;
  employeeId: string;
  fullName: string;
  activeCounter: string;
  totalTicketsServedToday: number;
  avgHandlingTimeMinutes: number | null;
}

export function StaffEfficiencyTable() {
  const [metrics, setMetrics] = useState<StaffMetric[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEfficiency = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<{ staffEfficiency: StaffMetric[] }>('/admin/analytics/staff-efficiency');
        setMetrics(data?.staffEfficiency || []);
      } catch (err) {
        console.error('Failed to load staff efficiency metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEfficiency();
  }, []);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ChartBarIcon size={20} className="text-emerald-400" />
        <h2 className="text-base font-semibold text-zinc-100">Counter Staff Productivity</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-zinc-500 text-xs font-mono">
          <ArrowClockwiseIcon size={18} className="animate-spin text-emerald-500" />
          <span>Loading staff metrics...</span>
        </div>
      ) : metrics.length === 0 ? (
        <p className="py-10 text-center text-xs text-zinc-500">No staff efficiency data available yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Register Desk</th>
                <th className="py-3 px-4">Served Today</th>
                <th className="py-3 px-4">Avg Handling Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {metrics.map((staff) => (
                <tr key={staff.staffId}>
                  <td className="py-3 px-4 font-medium">{staff.fullName} ({staff.employeeId})</td>
                  <td className="py-3 px-4 text-zinc-400">{staff.activeCounter}</td>
                  <td className="py-3 px-4 font-mono">{staff.totalTicketsServedToday} tickets</td>
                  <td className="py-3 px-4">
                    {staff.avgHandlingTimeMinutes !== null ? `${staff.avgHandlingTimeMinutes} min` : 'No data'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}